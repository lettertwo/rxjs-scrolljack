import {map} from 'rxjs/operator/map'
import {takeUntil} from 'rxjs/operator/takeUntil'
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
    return this.from(...DeltaObservableClasses.map(DeltaClass =>
      DeltaClass.start(target)
      .hijack()
      ::map(v => DeltaClass.move(root)
        .hijack()
        ::takeUntil(DeltaClass.stop(root).hijack())
      )
    ))
  }

  static scrollStop (target, ...DeltaObservableClasses) {
    return this.from(...DeltaObservableClasses.map(DeltaClass =>
      DeltaClass.stop(target).hijack()
    ))
  }
}

export default Scrolljack
