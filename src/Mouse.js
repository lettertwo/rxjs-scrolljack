import {Delta} from './Delta'

const MOUSE_DOWN = 'mousedown'
const MOUSE_MOVE = 'mousemove'
const MOUSE_UP = 'mouseup'

const START_VALUE = Object.freeze({deltaX: 0, deltaY: 0, deltaT: 0})
const STOP_VALUE = Object.freeze({deltaX: 0, deltaY: 0, deltaT: 0})

export class Mouse extends Delta {
  constructor (target, event = MOUSE_MOVE) {
    super(target, event)
  }

  static start (target, event = MOUSE_DOWN, value = START_VALUE) {
    return super.start(target, event, value)
  }

  static stop (target, event = MOUSE_UP, value = STOP_VALUE) {
    return super.stop(target, event, value)
  }
}

export default Mouse
