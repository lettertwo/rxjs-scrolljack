import {Delta} from './Delta'

const TOUCH_START = 'touchstart'
const TOUCH_MOVE = 'touchmove'
const TOUCH_END = 'touchend'

const START_VALUE = Object.freeze({deltaX: 0, deltaY: 0, deltaT: 0})
const STOP_VALUE = Object.freeze({deltaX: 0, deltaY: 0, deltaT: 0})

const excludeMultiTouch = e => e.touches.length <= 1

export class Touch extends Delta {
  constructor (target, event = TOUCH_MOVE) {
    super(target, event, excludeMultiTouch)
  }

  static start (target, event = TOUCH_START, value = START_VALUE) {
    return super.start(target, event, value)
  }

  static stop (target, event = TOUCH_END, value = STOP_VALUE) {
    return super.stop(target, event, value)
  }
}

export default Touch
