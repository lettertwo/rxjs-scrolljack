import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {fromHijackedEvent} from './operators/fromHijackedEvent'
import {DeltaOperator} from './operators/DeltaOperator'
import {MoveOperator} from './operators/MoveOperator'

const TOUCH_START = 'touchstart'
const TOUCH_MOVE = 'touchmove'
const TOUCH_END = 'touchend'

const excludeMultiTouch = e => e.touches.length <= 1

export class Touch extends Observable {
  constructor (target, event = TOUCH_MOVE) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = fromHijackedEvent(target, event, excludeMultiTouch)
      this.source.operator = new DeltaOperator()
    }
  }

  lift (operator) {
    const observable = new this.constructor(this)
    observable.operator = operator
    return observable
  }

  static from (target) {
    return new Touch(target)::takeUntil(Touch.stop(target))
  }

  static start (target) {
    return new Touch(target, TOUCH_START)
  }

  static move (target) {
    return new Touch(target).lift(new MoveOperator(
      Touch.start(target),
      Touch.stop(target),
    ))
  }

  static stop (target) {
    return new Touch(target, TOUCH_END)
  }
}

export default Touch
