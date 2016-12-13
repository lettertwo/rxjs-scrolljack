import $$observable from 'symbol-observable'
import {map} from 'rxjs/operator/map'
import {mergeMap} from 'rxjs/operator/mergeMap'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {take} from 'rxjs/operator/take'
import {throttle} from 'rxjs/operator/throttle'
import {DeltaObservable} from './observables/DeltaObservable'
import {Scroll} from './Scroll'

const isDeltaObservableLike = value => (
  value &&
  typeof value.scrollStart === 'function' &&
  typeof value.scrollStop === 'function' &&
  typeof value.scroll === 'function'
)

export class Scrolljack extends DeltaObservable {
  static scrollStart (target, maybeRootOrClosingSelector, ...DeltaObservableClasses) {
    let root = target
    let closingSelector = maybeRootOrClosingSelector

    if (isDeltaObservableLike(closingSelector)) {
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
      closingSelector = (_, DeltaClass) => DeltaClass.scrollStop(root)
    }

    const sources = DeltaObservableClasses.map(DeltaClass =>
      DeltaClass.scrollStart(target).hijack()
      ::throttle(value => closingSelector(value, DeltaClass))
    )

    if (sources.length > 1) {
      return this.merge(...sources)
    } else {
      return sources[0]
    }
  }

  static scroll (target, ...DeltaObservableClasses) {
    if (!DeltaObservableClasses.length) {
      DeltaObservableClasses.push(Scroll)
    }

    const sources = DeltaObservableClasses.map(DeltaClass =>
      DeltaClass.scroll(target).hijack()
    )

    if (sources.length > 1) {
      return this.merge(...sources)
    } else {
      return sources[0]
    }
  }

  static scrollWindow (target, maybeRootOrOpening, maybeClosingSelector, ...DeltaObservableClasses) {
    let root = target
    let opening = maybeRootOrOpening
    let closingSelector = maybeClosingSelector
    let openingSelector = () => opening

    if (isDeltaObservableLike(closingSelector)) {
      DeltaObservableClasses.unshift(maybeClosingSelector)
      closingSelector = null
    }

    if (isDeltaObservableLike(opening)) {
      DeltaObservableClasses.unshift(opening)
      opening = null
    }

    if (!DeltaObservableClasses.length) {
      DeltaObservableClasses.push(Scroll)
    }

    if (opening && typeof opening[$$observable] !== 'function') {
      root = opening
      opening = null
    }

    if (!opening) {
      openingSelector = DeltaClass => DeltaClass.scrollStart(target)
    }

    if (!closingSelector) {
      closingSelector = (_, DeltaClass) => DeltaClass.scrollStop(root)
    }

    const sources = DeltaObservableClasses.map(DeltaClass =>
      openingSelector(DeltaClass)::map(v =>
        DeltaClass.scroll(root).hijack()
        ::takeUntil(closingSelector(v, DeltaClass))
      )
    )

    if (sources.length > 1) {
      return this.merge(...sources)
    } else {
      return sources[0]
    }
  }

  static scrollStop (target, maybeRootOrOpening, ...DeltaObservableClasses) {
    let root = target
    let opening = maybeRootOrOpening

    if (isDeltaObservableLike(opening)) {
      DeltaObservableClasses.unshift(opening)
      opening = null
    }

    if (!DeltaObservableClasses.length) {
      DeltaObservableClasses.push(Scroll)
    }

    let openingSelector = () => opening

    if (!opening || typeof opening[$$observable] !== 'function') {
      root = opening || root
      openingSelector = DeltaClass => DeltaClass.scrollStart(target)
    }

    const sources = DeltaObservableClasses.map(DeltaClass =>
      openingSelector(DeltaClass)::mergeMap(() =>
        DeltaClass.scrollStop(root).hijack()
        ::take(1)
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
