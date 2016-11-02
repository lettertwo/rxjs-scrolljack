import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {filter} from 'rxjs/operator/filter'
import {WheelEventEmulatorOperator} from '../operators/WheelEventEmulatorOperator'
import {createEventSourcePool} from '../events/createEventSourcePool'
import {WHEEL} from '../events'

const eventSourcePool = createEventSourcePool(WheelEventEmulatorOperator)

export class EmulatedWheelEventObservable extends Observable {
  constructor (target, eventType, predicate) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = eventSourcePool(target, eventType, WHEEL)
        ::filter(({type}) => type === eventType)

      if (predicate) {
        this.source = this.source::filter(predicate)
      }
    }
  }

  lift (operator) {
    const observable = new EmulatedWheelEventObservable(this)
    observable.operator = operator
    return observable
  }

  static create (...args) {
    return new EmulatedWheelEventObservable(...args)
  }
}

export default EmulatedWheelEventObservable
