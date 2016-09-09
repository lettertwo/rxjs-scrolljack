import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {_switch} from 'rxjs/operator/switch'
import {mapTo} from 'rxjs/operator/mapTo'
import {fromHijackedEvent} from './operators/fromHijackedEvent'
import {DeltaOperator} from './operators/DeltaOperator'
import {MoveOperator} from './operators/MoveOperator'
import {getRoot} from './utils'

const MOUSE_DOWN = 'mousedown'
const MOUSE_MOVE = 'mousemove'
const MOUSE_UP = 'mouseup'

const START_VALUE = Object.freeze({deltaX: 0, deltaY: 0, deltaT: 0})
const STOP_VALUE = Object.freeze({deltaX: 0, deltaY: 0, deltaT: 0})

export class Mouse extends Observable {
  constructor (target, event = MOUSE_MOVE) {
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

  static create (target) {
    return new Mouse(target)
  }

  static from (target) {
    return new Mouse(target)::takeUntil(Mouse.stop(target))
  }

  static start (target) {
    return new Mouse(target, MOUSE_DOWN)::mapTo(START_VALUE)
  }

  static move (target, updater, scheduler) {
    if (typeof updater === 'function') updater = updater()
    return this
      .start(target)
      .lift(new MoveOperator(this, getRoot(), updater, scheduler))
      ::_switch()
  }

  static stop (target) {
    return new Mouse(target, MOUSE_UP)::mapTo(STOP_VALUE)
  }
}

export default Mouse
