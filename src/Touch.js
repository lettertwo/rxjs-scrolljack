import {Delta} from './Delta'

const TOUCH_START = 'touchstart'
const TOUCH_MOVE = 'touchmove'
const TOUCH_END = 'touchend'

const excludeMultiTouch = e => e.touches.length <= 1

export class Touch extends Delta {
  constructor (target, event = TOUCH_MOVE) {
    super(target, event, excludeMultiTouch)
  }

  static start (target) {
    return super.start(target, TOUCH_START)
  }

  static stop (target) {
    return super.stop(target, TOUCH_END)
  }
}

export default Touch
