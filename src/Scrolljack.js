import {map} from 'rxjs/operator/map'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {DeltaObservable} from './observables/DeltaObservable'

export class Scrolljack extends DeltaObservable {
  static scrollStart (target, ...DeltaObservableClasses) {
    return this.from(...DeltaObservableClasses.map(DeltaClass =>
      DeltaClass.start(target).hijack()
    ))
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
