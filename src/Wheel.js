import $$observable from 'symbol-observable'
import {Delta} from './Delta'
import {DeltaOperator} from './operators/DeltaOperator'
import {fromEmulatedWheelEvent} from './operators/fromEmulatedWheelEvent'

const WHEEL_START = 'wheelstart'
const WHEEL_MOVE = 'wheelmove'
const WHEEL_END = 'wheelend'

export class Wheel extends Delta {
  constructor (target, event = WHEEL_MOVE, ...hijackArgs) {
    if (typeof target[$$observable] === 'function') {
      super(target)
    } else {
      const source = fromEmulatedWheelEvent(target, event, ...hijackArgs)
      source.operator = new DeltaOperator()
      super(source)
    }
  }

  static start (target, event = WHEEL_START) {
    return super.start(target, event)
  }

  static move (target, updater, scheduler) {
    return super.move(target, updater, scheduler, target)
  }

  static stop (target, event = WHEEL_END) {
    return super.stop(target, event)
  }
}

export default Wheel
