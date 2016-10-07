import {mergeStatic as merge} from 'rxjs/operator/merge'
import {DeltaObservable} from './observables/DeltaObservable'

export class Scrolljack extends DeltaObservable {
  static from (...DeltaObservableClasses) {
    if (DeltaObservableClasses.length > 1) {
      return new this(merge(...DeltaObservableClasses))
    } else {
      return new this(...DeltaObservableClasses)
    }
  }

  static start (target, ...DeltaObservableClasses) {
    return this.from(...DeltaObservableClasses.map(DeltaClass =>
      DeltaClass.start(target).hijack()
    ))
  }

  static move (target, ...DeltaObservableClasses) {
    return this.from(...DeltaObservableClasses.map(DeltaClass =>
      DeltaClass.move(target).hijack()
    ))
  }

  static stop (target, ...DeltaObservableClasses) {
    return this.from(...DeltaObservableClasses.map(DeltaClass =>
      DeltaClass.stop(target).hijack()
    ))
  }
}

export default Scrolljack
