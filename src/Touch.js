import $$observable from 'symbol-observable'
import {takeUntil} from 'rxjs/operator/takeUntil'
import {skipWhile} from 'rxjs/operator/skipWhile'
import {take} from 'rxjs/operator/take'
import {timer} from 'rxjs/observable/timer'
import {raceStatic as race} from 'rxjs/operator/race'
import {mergeStatic as merge} from 'rxjs/operator/merge'
import {mergeMap} from 'rxjs/operator/mergeMap'
import {DeltaOperator} from './operators/DeltaOperator'
import {DeltaObservable} from './observables/DeltaObservable'
import {EmulatedTouchEventObservable} from './observables/EmulatedTouchEventObservable'
import {inside} from './utils'
import {TOUCH_START, TOUCH_MOVE, TOUCH_END, TOUCH_CANCEL} from './events'

const excludeMultiTouch = e => e.touches.length <= 1

export class Touch extends DeltaObservable {
  constructor (target, event = TOUCH_MOVE) {
    if (typeof target[$$observable] === 'function') {
      super(target)
    } else {
      const source = EmulatedTouchEventObservable.create(target, event, excludeMultiTouch)
      source.operator = new DeltaOperator(computeTouchDelta, computeTouchVelocity)
      super(source)
    }
  }

  static scrollStart (target, radius = {w: 10, h: 10}, delay = 300) {
    let scrollCancel = this.scrollStop(target)
    if (delay > 0) scrollCancel = race(timer(delay), scrollCancel)
    return super
      .scrollStart(target, TOUCH_START)
      .hijack()
      ::mergeMap(offset => super
        .from(target)
        .hijack()
        .accumulate()
        ::takeUntil(scrollCancel)
        ::skipWhile(netValue => inside(radius.w, radius.h, netValue.deltaX, netValue.deltaY))
        ::take(1)
      )
  }

  static scrollStop (target) {
    return new this(merge(
      super.scrollStop(target, TOUCH_END),
      super.scrollStop(target, TOUCH_CANCEL),
    ))
  }
}

export default Touch

const computeTouchDelta = (event, lastEvent) => {
  let deltaX = 0
  let deltaY = 0
  if (lastEvent && lastEvent.touches && lastEvent.touches.length) {
    const {clientX: prevX, clientY: prevY} = lastEvent.touches[0]
    const {clientX, clientY} = event.touches[0]
    deltaX = prevX - clientX
    deltaY = prevY - clientY
  }
  return {deltaX, deltaY}
}

const computeTouchVelocity = (event, lastEvent, deltaT) => {
  let velocityX = 0
  let velocityY = 0
  if (lastEvent && lastEvent.touches && lastEvent.touches.length) {
    const t = deltaT / 1000
    const {clientX: prevX, clientY: prevY} = lastEvent.touches[0]
    const {clientX, clientY} = event.touches[0]
    velocityX = (prevX - clientX) / t
    velocityY = (prevY - clientY) / t
  }
  return {velocityX, velocityY}
}
