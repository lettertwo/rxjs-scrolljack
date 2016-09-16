import {takeUntil} from 'rxjs/operator/takeUntil'
import {skipWhile} from 'rxjs/operator/skipWhile'
import {take} from 'rxjs/operator/take'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {mergeMap} from 'rxjs/operator/mergeMap'
import {Delta} from './Delta'
import {inside} from './utils'
import {TOUCH_START, TOUCH_MOVE, TOUCH_END, TOUCH_CANCEL} from './events'

const excludeMultiTouch = e => e.touches.length <= 1

export class Touch extends Delta {
  constructor (target, event = TOUCH_MOVE) {
    super(target, event, excludeMultiTouch)
  }

  static start (target, radius = {w: 10, h: 10}) {
    return super
      .start(target, TOUCH_START)
      .hijack()
      ::mergeMap(offset => super
        .create(target)
        .hijack()
        .accumulate()
        ::takeUntil(this.stop(target))
        ::skipWhile(netValue => inside(radius.w, radius.h, netValue.deltaX, netValue.deltaY))
        ::take(1)
      )
  }

  static stop (target) {
    return merge(
      super.stop(target, TOUCH_END),
      super.stop(target, TOUCH_CANCEL),
    )
  }
}

export default Touch
