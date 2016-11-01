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
    super(target, event, null, computeMouseDelta, computeMouseVelocity)
  }

  static scrollStart (target, radius = {w: 10, h: 10}) {
    return super
      .scrollStart(target, MOUSE_DOWN)
      .hijack()
      ::mergeMap(offset => super
        .from(target)
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

const computeMouseDelta = (event, lastEvent) => {
  let deltaX = 0
  let deltaY = 0
  if (lastEvent) {
    const {clientX: prevX, clientY: prevY} = lastEvent
    const {clientX, clientY} = event
    deltaX = prevX - clientX
    deltaY = prevY - clientY
  }
  return {deltaX, deltaY}
}

const computeMouseVelocity = (event, lastEvent, deltaT) => {
  let velocityX = 0
  let velocityY = 0
  if (deltaT && lastEvent) {
    const t = deltaT / 1000
    const {clientX: prevX, clientY: prevY} = lastEvent
    const {clientX, clientY} = event
    velocityX = (prevX - clientX) / t
    velocityY = (prevY - clientY) / t
  }
  return {velocityX, velocityY}
}
