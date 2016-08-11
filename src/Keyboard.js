import $$observable from 'symbol-observable'
import {Observable} from 'rxjs/Observable'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {fromHijackedEvent} from './operators/fromHijackedEvent'
import {DeltaOperator} from './operators/DeltaOperator'

const KEY_START = 'keydown'
const KEY_MOVE = 'keydown'
const KEY_STOP = 'keyup'
const KEY_CODES = [
  32,  // spacebar
  33,  // pageup
  34,  // pagedown
  35,  // end
  36,  // home
  37,  // left
  38,  // up
  39,  // right
  40,  // down
]
const SCROLL_DELTA = 20

const keyCodeToScrollDelta = ({keyCode}) => {
  switch (keyCode) {
    case 33:  // pageup
    case 36:  // home
    case 38:  // up
      return {deltaX: 0, deltaY: -SCROLL_DELTA}
    case 32:  // spacebar
    case 34:  // pagedown
    case 35:  // end
    case 40:  // down
      return {deltaX: 0, deltaY: SCROLL_DELTA}
    case 37:  // left
      return {deltaX: -SCROLL_DELTA, deltaY: 0}
    case 39:  // right
      return {deltaX: SCROLL_DELTA, deltaY: 0}
  }
}

const includeUnmodifiedKeys = (...codes) => e => {
  const modified = e.ctrlKey || e.shiftKey || e.altKey
  return !modified && codes.includes(e.keyCode)
}

export class Keyboard extends Observable {
  constructor (target, event = KEY_MOVE) {
    if (typeof target[$$observable] === 'function') {
      super()
      this.source = target[$$observable]()
    } else {
      super()
      this.source = fromHijackedEvent(target, event, includeUnmodifiedKeys(...KEY_CODES))
      this.source.operator = new DeltaOperator(keyCodeToScrollDelta)
    }
  }

  lift (operator) {
    const observable = new this.constructor(this)
    observable.operator = operator
    return observable
  }

  static from (target) {
    return new Keyboard(target)::takeUntil(Keyboard.stop(target))
  }

  static start (target) {
    return new Keyboard(target, KEY_START)
  }

  static move (target) {
    return new Keyboard(target)
  }

  static stop (target) {
    return new Keyboard(target, KEY_STOP)
  }
}

export default Keyboard
