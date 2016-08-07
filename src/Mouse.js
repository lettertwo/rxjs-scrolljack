import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {fromHijackedEvent} from './operators/fromHijackedEvent'
import {DeltaOperator} from './operators/DeltaOperator'
import {MouseMoveOperator} from './operators/mouse'

const MOUSE_DOWN = 'mousedown'
const MOUSE_MOVE = 'mousemove'
const MOUSE_UP = 'mouseup'

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

  static from (target) {
    return new Mouse(target)
  }

  static start (target) {
    return new Mouse(target, MOUSE_DOWN)
  }

  static move (target) {
    return new Mouse(target).lift(new MouseMoveOperator(
      Mouse.start(target),
      Mouse.stop(target),
    ))
  }

  static stop (target) {
    return new Mouse(target, MOUSE_UP)
  }
}

export default Mouse
