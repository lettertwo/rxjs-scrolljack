import {Subscriber} from 'rxjs/Subscriber'
import {timeStamp} from '../utils'
import {touchEvents, mouseEvents} from '../events'

export class DeltaSubscriber extends Subscriber {
  constructor (destination, computeDelta, computeVelocity) {
    super(destination)
    this.computeDelta = computeDelta || DeltaSubscriber._computeDelta
    this.computeVelocity = computeVelocity || DeltaSubscriber._computeVelocity
    this._lastEvent = null
    this._lastTime = null
  }

  static _computeVelocity (event, lastEvent, deltaT) {
    if (!deltaT) return {velocityX: 0, velocityY: 0}

    let {velocityX, velocityY, deltaX, deltaY} = event
    let t = deltaT / 1000

    if (event.type && touchEvents.includes(event.type)) {
      if (!lastEvent || !lastEvent.touches || !lastEvent.touches.length) {
        velocityX = 0
        velocityY = 0
      } else {
        const {clientX: prevX, clientY: prevY} = lastEvent.touches[0]
        const {clientX, clientY} = event.touches[0]
        velocityX = (prevX - clientX) / t
        velocityY = (prevY - clientY) / t
      }
    } else if (event.type && mouseEvents.includes(event.type)) {
      if (!lastEvent) {
        velocityX = 0
        velocityY = 0
      } else {
        const {clientX: prevX, clientY: prevY} = lastEvent
        const {clientX, clientY} = event
        velocityX = (prevX - clientX) / t
        velocityY = (prevY - clientY) / t
      }
    } else {
      velocityX = deltaX / t
      velocityY = deltaY / t
    }

    return {velocityX, velocityY}
  }

  static _computeDelta (event, lastEvent) {
    let {deltaX, deltaY} = event

    if (event.type && touchEvents.includes(event.type)) {
      if (!lastEvent || !lastEvent.touches || !lastEvent.touches.length) {
        deltaX = 0
        deltaY = 0
      } else {
        const {clientX: prevX, clientY: prevY} = lastEvent.touches[0]
        const {clientX, clientY} = event.touches[0]
        deltaX = prevX - clientX
        deltaY = prevY - clientY
      }
    } else if (event.type && mouseEvents.includes(event.type)) {
      if (!lastEvent) {
        deltaX = 0
        deltaY = 0
      } else {
        const {clientX: prevX, clientY: prevY} = lastEvent
        const {clientX, clientY} = event
        deltaX = prevX - clientX
        deltaY = prevY - clientY
      }
    }

    return {deltaX, deltaY}
  }

  _next (event) {
    const {_lastEvent: lastEvent, _lastTime: lastTime} = this
    const time = timeStamp(event)
    const deltaT = lastTime ? time - lastTime : 0
    const delta = this.computeDelta(event, lastEvent, deltaT)
    const velocity = this.computeVelocity(event, lastEvent, deltaT)

    this._lastEvent = event
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
  constructor (computeDelta, computeVelocity) {
    this.computeDelta = computeDelta
    this.computeVelocity = computeVelocity
  }

  call (subscriber, source) {
    return source._subscribe(
      new DeltaSubscriber(subscriber, this.computeDelta, this.computeVelocity)
    )
  }
}

export default DeltaOperator
