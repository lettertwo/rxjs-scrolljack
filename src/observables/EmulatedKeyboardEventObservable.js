import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {filter} from 'rxjs/operator/filter'
import {KeyboardEventEmulatorOperator} from '../operators/KeyboardEventEmulatorOperator'
import {createEventSourcePool} from '../events/createEventSourcePool'
import {KEY_UP, KEY_DOWN, KEY_END} from '../events'

// Map synthetic keyboard events to real ones.
const getRealEventType = eventType => {
  switch (eventType) {
    case KEY_UP:
    case KEY_END:
      return KEY_UP
    default:
      return KEY_DOWN
  }
}

const eventSourcePool = createEventSourcePool(KeyboardEventEmulatorOperator)

export class EmulatedKeyboardEventObservable extends Observable {
  constructor (target, eventType, predicate) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = eventSourcePool.get(target, eventType, getRealEventType(eventType))

      if (predicate) {
        this.source = this.source::filter(predicate)
      }
    }
  }

  lift (operator) {
    const observable = new EmulatedKeyboardEventObservable(this)
    observable.operator = operator
    return observable
  }

  static create (...args) {
    return new EmulatedKeyboardEventObservable(...args)
  }
}

export default EmulatedKeyboardEventObservable
