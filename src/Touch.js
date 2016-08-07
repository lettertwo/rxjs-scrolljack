import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {fromHijackedEvent} from './operators/fromHijackedEvent'
import {DeltaOperator} from './operators/DeltaOperator'

const TOUCH_START = 'touchstart'
const TOUCH_MOVE = 'touchmove'
const TOUCH_END = 'touchend'

export class Touch extends Observable {
  constructor (target, event = TOUCH_MOVE) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = fromHijackedEvent(target, event)
      this.source.operator = new DeltaOperator()
    }
  }

  lift (operator) {
    const observable = new this.constructor(this)
    observable.operator = operator
    return observable
  }

  static from (target) {
    return new Touch(target)
  }

  static start (target) {
    return new Touch(target, TOUCH_START)
  }

  static move (target) {
    return new Touch(target)
  }

  static stop (target) {
    return new Touch(target, TOUCH_END)
  }
}

export default Touch