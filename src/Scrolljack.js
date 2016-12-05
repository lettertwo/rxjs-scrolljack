import {map} from 'rxjs/operator/map'
import {mergeAll} from 'rxjs/operator/mergeAll'
import {mergeMap} from 'rxjs/operator/mergeMap'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {take} from 'rxjs/operator/take'
import {throttle} from 'rxjs/operator/throttle'
import {DeltaObservable} from './observables/DeltaObservable'
import {Scroll} from './Scroll'

const parseOpts = (target, rootOrDeltaObservableClass, ...DeltaObservableClasses) => {
  let root = rootOrDeltaObservableClass
  if (!root) {
    root = target
  } else if (root === DeltaObservable || root.prototype instanceof DeltaObservable) {
    DeltaObservableClasses.unshift(root)
    root = target
  }

  if (!DeltaObservableClasses.length) {
    DeltaObservableClasses.push(Scroll)
  }

  return [target, root, DeltaObservableClasses]
}
const isDeltaObservable = value =>
  value && (value === DeltaObservable || value.prototype instanceof DeltaObservable)

export class Scrolljack extends DeltaObservable {
  static scrollStart (target, maybeRootOrClosingSelector, ...DeltaObservableClasses) {
    let root = target
    let closingSelector = maybeRootOrClosingSelector

    if (isDeltaObservable(closingSelector)) {
      DeltaObservableClasses.unshift(closingSelector)
      closingSelector = null
    }

    if (!DeltaObservableClasses.length) {
      DeltaObservableClasses.push(Scroll)
    }

    if (typeof closingSelector !== 'function') {
      root = closingSelector || root
      closingSelector = null
    }

    if (!closingSelector) {
      closingSelector = DeltaClass => DeltaClass.scrollStop(root)
    }

    const sources = DeltaObservableClasses.map(DeltaClass =>
      DeltaClass.scrollStart(target).hijack()
      ::throttle(() => closingSelector(DeltaClass))
    )

    if (sources.length > 1) {
      return this.merge(...sources)
    } else {
      return sources[0]
    }
  }

  static scroll (...args) {
    return this.scrollWindow(...args)::mergeAll()
  }

  static scrollWindow (...args) {
    const [target, root, DeltaObservableClasses] = parseOpts(...args)
    const sources = DeltaObservableClasses.map(DeltaClass =>
      DeltaClass.scrollStart(target).hijack()::map(v =>
        DeltaClass.scroll(root).hijack()::takeUntil(
          DeltaClass.scrollStop(root).hijack()
        )
      )
    )

    if (sources.length > 1) {
      return this.merge(...sources)
    } else {
      return sources[0]
    }
  }

  static scrollStop (...args) {
    const [target, root, DeltaObservableClasses] = parseOpts(...args)
    const sources = DeltaObservableClasses.map(DeltaClass =>
      DeltaClass.scrollStart(target).hijack()::mergeMap(() =>
        DeltaClass.scrollStop(root).hijack()::take(1)
      )
    )

    if (sources.length > 1) {
      return this.merge(...sources)
    } else {
      return sources[0]
    }
  }
}

export default Scrolljack
