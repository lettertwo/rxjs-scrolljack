import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {filter} from 'rxjs/operator/filter'
import {TouchEventEmulatorOperator} from '../operators/TouchEventEmulatorOperator'
import {createEventSourcePool} from '../events/createEventSourcePool'

const eventSourcePool = createEventSourcePool(TouchEventEmulatorOperator)

export class EmulatedTouchEventObservable extends Observable {
  constructor (target, eventType, predicate) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = eventSourcePool.get(target, eventType)

      if (predicate) {
        this.source = this.source::filter(predicate)
      }
    }
  }

  lift (operator) {
    const observable = new EmulatedTouchEventObservable(this)
    observable.operator = operator
    return observable
  }

  static create (...args) {
    return new EmulatedTouchEventObservable(...args)
  }
}

export default EmulatedTouchEventObservable
