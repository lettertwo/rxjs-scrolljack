import {skipWhile} from 'rxjs/operator/skipWhile'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {take} from 'rxjs/operator/take'
import {mergeMap} from 'rxjs/operator/mergeMap'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {DeltaObservable} from './observables/DeltaObservable'
import {inside} from './utils'
import {MOUSE_DOWN, MOUSE_MOVE, MOUSE_UP, MOUSE_LEAVE, CLICK} from './events'

export class Mouse extends DeltaObservable {
  constructor (target, event = MOUSE_MOVE) {
    super(target, event)
  }

  static start (target, radius = {w: 10, h: 10}) {
    return super
      .start(target, MOUSE_DOWN)
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
    return new this(merge(
      super.stop(target, MOUSE_UP),
      super.stop(target, MOUSE_LEAVE),
      super.stop(target, CLICK),
    ))
  }
}

export default Mouse
