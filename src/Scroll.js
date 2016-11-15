import $$observable from 'symbol-observable'
import {DeltaObservable} from './observables/DeltaObservable'
import {DeltaOperator} from './operators/DeltaOperator'
import {EmulatedScrollEventObservable} from './observables/EmulatedScrollEventObservable'
import {SCROLL_START, SCROLL_MOVE, SCROLL_END} from './events'

export class Scroll extends DeltaObservable {
  constructor (target, event = SCROLL_MOVE) {
    if (typeof target[$$observable] === 'function') {
      super(target)
    } else {
      const source = EmulatedScrollEventObservable.create(target, event)
      source.operator = new DeltaOperator(computeScrollDelta, computeScrollVelocity, snapshotScrollEvent)
      super(source)
    }
  }

  static scrollStart (target) {
    return super.scrollStart(target, SCROLL_START)
  }

  static scrollStop (target) {
    return super.scrollStop(target, SCROLL_END)
  }
}

export default Scroll

const computeScrollDelta = (event, lastEvent) => {
  let deltaX = 0
  let deltaY = 0
  if (lastEvent) {
    const {scrollLeft: prevX, scrollTop: prevY} = lastEvent
    const {scrollLeft: x, scrollTop: y} = event.target
    deltaX = x - prevX
    deltaY = y - prevY
  }
  return {deltaX, deltaY}
}

const computeScrollVelocity = (event, lastEvent, deltaT) => {
  let velocityX = 0
  let velocityY = 0
  if (deltaT && lastEvent) {
    const t = deltaT / 1000
    const {scrollLeft: prevX, scrollTop: prevY} = lastEvent
    const {scrollLeft: x, scrollTop: y} = event.target
    velocityX = (x - prevX) / t
    velocityY = (y - prevY) / t
  }
  return {velocityX, velocityY}
}

const snapshotScrollEvent = event => {
  const {scrollLeft, scrollTop} = event.target
  return {scrollLeft, scrollTop}
}
