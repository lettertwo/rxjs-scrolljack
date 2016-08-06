import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {fromHijackedEvent} from './operators/fromHijackedEvent'
import {DeltaOperator} from './operators/DeltaOperator'
import {
  WheelStartOperator,
  WheelMoveOperator,
  WheelStopOperator,
} from './operators/wheel'

const WHEEL = 'wheel'

export class Wheel extends Observable {
  constructor (target) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = fromHijackedEvent(target, WHEEL)
      this.source.operator = new DeltaOperator()
    }
  }

  lift (operator) {
    const observable = new this.constructor(this)
    observable.operator = operator
    return observable
  }

  static from (target) {
    return new Wheel(target)
  }

  static start (target) {
    return new Wheel(target).lift(new WheelStartOperator())
  }

  static move (target) {
    return new Wheel(target).lift(new WheelMoveOperator())
  }

  static stop (target) {
    return new Wheel(target).lift(new WheelStopOperator())
  }
}

export default Wheel
