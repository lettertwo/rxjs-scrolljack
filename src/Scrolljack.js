import {map} from 'rxjs/operator/map'
import {mergeAll} from 'rxjs/operator/mergeAll'
import {mergeMap} from 'rxjs/operator/mergeMap'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {take} from 'rxjs/operator/take'
import {throttle} from 'rxjs/operator/throttle'
import {DeltaObservable} from './observables/DeltaObservable'

export class Scrolljack extends DeltaObservable {
  static scrollStart (target, root, ...DeltaObservableClasses) {
    const sources = DeltaObservableClasses.map(DeltaClass =>
      DeltaClass.scrollStart(target).hijack()::throttle(() =>
        DeltaClass.scrollStop(root).hijack()
      )
    )

    if (sources.length > 1) {
      return this.merge(...sources)
    } else {
      return sources[0]
    }
  }

  static scroll (target, root, ...DeltaObservableClasses) {
    return this.scrollWindow(target, root, ...DeltaObservableClasses)::mergeAll()
  }

  static scrollWindow (target, root, ...DeltaObservableClasses) {
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

  static scrollStop (target, root, ...DeltaObservableClasses) {
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
