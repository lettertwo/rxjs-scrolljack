import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {Subject} from 'rxjs/Subject'
import {HijackableEventObservable} from './HijackableEventObservable'
import {multicast} from 'rxjs/operator/multicast'
import {filter} from 'rxjs/operator/filter'
import {WheelEventEmulatorOperator} from '../operators/WheelEventEmulatorOperator'
import {WHEEL} from '../events'

const wheelTargets = new WeakMap()

const getEventSource = target => {
  if (!wheelTargets.has(target)) {
    wheelTargets.set(target, HijackableEventObservable.create(target, WHEEL)
      .hijack()
      .lift(new WheelEventEmulatorOperator())
        ::multicast(new Subject())
        .refCount()
    )
  }

  return wheelTargets.get(target)
}

export class EmulatedWheelEventObservable extends Observable {
  constructor (target, event, predicate) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = getEventSource(target)
        ::filter(({type}) => type === event)

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
