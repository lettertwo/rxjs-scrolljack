import $$observable from 'symbol-observable'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {DeltaObservable} from './observables/DeltaObservable'

export const combine = (...DeltaClasses) => {
  class MultiDeltaObservable extends DeltaObservable {
    constructor (target) {
      if (typeof target[$$observable] === 'function') {
        super(target)
      } else {
        super(merge(...DeltaClasses.map(DeltaClass => (
          DeltaClass.from(target)
        ))))
      }
    }

    static start (target) {
      return this.from(merge(...DeltaClasses.map(DeltaClass => (
        DeltaClass.start(target)
      ))))
    }

    static stop (target) {
      return this.from(merge(...DeltaClasses.map(DeltaClass => (
        DeltaClass.stop(target)
      ))))
    }
  }

  return MultiDeltaObservable
}

export default combine
