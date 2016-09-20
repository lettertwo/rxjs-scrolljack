import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {fromEvent} from 'rxjs/observable/fromEvent'
import {filter} from 'rxjs/operator/filter'
import {HijackOperator} from '../operators/HijackOperator'

export class HijackableEventObservable extends Observable {
  constructor (target, event, predicate, ...args) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = fromEvent(target, event, ...args)
      if (predicate) {
        this.source = this.source::filter(predicate)
      }
    }
  }

  lift (operator) {
    const observable = new HijackableEventObservable(this)
    observable.operator = operator
    return observable
  }

  static create (...args) {
    return new HijackableEventObservable(...args)
  }

  hijack (predicate) {
    return this.lift(new HijackOperator(predicate))
  }
}

export default HijackableEventObservable
