import {mergeStatic as merge} from 'rxjs/operator/merge'
import {map} from 'rxjs/operator/map'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {DeltaObservable} from './observables/DeltaObservable'

export class Scrolljack extends DeltaObservable {
  static from (...DeltaObservableClasses) {
    if (DeltaObservableClasses.length > 1) {
      return new this(merge(...DeltaObservableClasses))
    } else {
      return new this(...DeltaObservableClasses)
    }
  }

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
