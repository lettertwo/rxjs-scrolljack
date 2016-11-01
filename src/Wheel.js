import $$observable from 'symbol-observable'
import {DeltaObservable} from './observables/DeltaObservable'
import {DeltaOperator} from './operators/DeltaOperator'
import {EmulatedWheelEventObservable} from './observables/EmulatedWheelEventObservable'
import {WHEEL_START, WHEEL_MOVE, WHEEL_END} from './events'

export class Wheel extends DeltaObservable {
  constructor (target, event = WHEEL_MOVE) {
    if (typeof target[$$observable] === 'function') {
      super(target)
    } else {
      const source = EmulatedWheelEventObservable.create(target, event)
      source.operator = new DeltaOperator()
      super(source)
    }
  }

  static scrollStart (target) {
    return super.scrollStart(target, WHEEL_START)
  }

  static scrollStop (target) {
    return super.scrollStop(target, WHEEL_END)
  }
}

export default Wheel
