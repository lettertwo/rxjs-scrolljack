import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {filter} from 'rxjs/operator/filter'
import {ScrollEventEmulatorOperator} from '../operators/ScrollEventEmulatorOperator'
import {createEventSourcePool} from '../events/createEventSourcePool'
import {SCROLL} from '../events'

const eventSourcePool = createEventSourcePool(ScrollEventEmulatorOperator)

export class EmulatedScrollEventObservable extends Observable {
  constructor (target, eventType, predicate) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = eventSourcePool(target, eventType, SCROLL)
        ::filter(({type}) => type === eventType)

      if (predicate) {
        this.source = this.source::filter(predicate)
      }
    }
  }

  lift (operator) {
    const observable = new EmulatedScrollEventObservable(this)
    observable.operator = operator
    return observable
  }

  static create (...args) {
    return new EmulatedScrollEventObservable(...args)
  }
}

export default EmulatedScrollEventObservable
