import $$observable from 'symbol-observable'
import {Delta} from './Delta'
import {DeltaOperator} from './operators/DeltaOperator'
import {fromEmulatedWheelEvent} from './operators/fromEmulatedWheelEvent'
import {WHEEL_START, WHEEL_MOVE, WHEEL_END} from './events'

export class Wheel extends Delta {
  constructor (target, event = WHEEL_MOVE) {
    if (typeof target[$$observable] === 'function') {
      super(target)
    } else {
      const source = fromEmulatedWheelEvent(target, event)
      source.operator = new DeltaOperator()
      super(source)
    }
  }

  static start (target) {
    return super.start(target, WHEEL_START)
  }

  static move (target, updater, scheduler) {
    return super.move(target, updater, scheduler, target)
  }

  static stop (target) {
    return super.stop(target, WHEEL_END)
  }
}

export default Wheel
