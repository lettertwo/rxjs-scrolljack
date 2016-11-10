import {Subscriber} from 'rxjs/Subscriber'
import {timeStamp} from '../utils'

export class DeltaSubscriber extends Subscriber {
  constructor (destination, computeDelta, computeVelocity, snapshotEvent) {
    super(destination)
    this.computeDelta = computeDelta || DeltaSubscriber._computeDelta
    this.computeVelocity = computeVelocity || DeltaSubscriber._computeVelocity
    this.snapshotEvent = snapshotEvent || DeltaSubscriber._snapshotEvent
    this._lastEvent = null
    this._lastTime = null
  }

  static _computeVelocity (event, lastEvent, deltaT) {
    let {velocityX, velocityY, deltaX, deltaY} = event

    if (velocityX == null && velocityY == null) {
      velocityX = 0
      velocityY = 0

      if (deltaT && deltaX != null && deltaY != null) {
        let t = deltaT / 1000
        velocityX = deltaX / t
        velocityY = deltaY / t
      }
    }

    return {velocityX, velocityY}
  }

  static _computeDelta (event, lastEvent) {
    let {deltaX, deltaY} = event
    return {deltaX, deltaY}
  }

  static _snapshotEvent (event) {
    return event
  }

  _next (event) {
    const {_lastEvent: lastEvent, _lastTime: lastTime} = this
    const time = timeStamp(event)
    const deltaT = lastTime ? time - lastTime : 0
    const delta = this.computeDelta(event, lastEvent, deltaT)
    const velocity = this.computeVelocity(event, lastEvent, deltaT)

    this._lastEvent = this.snapshotEvent(event)
    this._lastTime = time

    super._next({...delta, ...velocity, deltaT, event})
  }

  _complete () {
    this._lastEvent = null
    this._lastTime = null
    super._complete()
  }
}

export class DeltaOperator {
  constructor (computeDelta, computeVelocity, snapshotEvent) {
    this.computeDelta = computeDelta
    this.computeVelocity = computeVelocity
    this.snapshotEvent = snapshotEvent
  }

  call (subscriber, source) {
    return source._subscribe(new DeltaSubscriber(
      subscriber,
      this.computeDelta,
      this.computeVelocity,
      this.snapshotEvent,
    ))
  }
}

export default DeltaOperator
