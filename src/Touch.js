import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {_switch} from 'rxjs/operator/switch'
import {mapTo} from 'rxjs/operator/mapTo'
import {fromHijackedEvent} from './operators/fromHijackedEvent'
import {DeltaOperator} from './operators/DeltaOperator'
import {MoveOperator} from './operators/MoveOperator'
import {getRoot} from './utils'

const TOUCH_START = 'touchstart'
const TOUCH_MOVE = 'touchmove'
const TOUCH_END = 'touchend'

const START_VALUE = Object.freeze({deltaX: 0, deltaY: 0, deltaT: 0})
const STOP_VALUE = Object.freeze({deltaX: 0, deltaY: 0, deltaT: 0})

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

  static create (target) {
    return new Touch(target)
  }

  static from (target) {
    return new Touch(target)::takeUntil(Touch.stop(target))
  }

  static start (target) {
    return new Touch(target, TOUCH_START)::mapTo(START_VALUE)
  }

  static move (target, updater, scheduler) {
    if (typeof updater === 'function') updater = updater()
    return this
      .start(target)
      .lift(new MoveOperator(this, getRoot(), updater, scheduler))
      ::_switch()
  }

  static stop (target) {
    return new Touch(target, TOUCH_END)::mapTo(STOP_VALUE)
  }
}

export default Touch
