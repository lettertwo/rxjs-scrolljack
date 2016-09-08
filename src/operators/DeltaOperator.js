import {Subscriber} from 'rxjs/Subscriber'
import {timeStamp} from '../utils'

export class DeltaSubscriber extends Subscriber {
  constructor (destination, computeDelta, computeVelocity) {
    super(destination)
    this.computeDelta = computeDelta || DeltaSubscriber._computeDelta
    this.computeVelocity = computeVelocity || DeltaSubscriber._computeVelocity
    this._lastValue = null
    this._lastTime = null
  }

  static _computeVelocity (value, lastValue, deltaT) {
    let {velocityX, velocityY, deltaX, deltaY} = value
    let t = deltaT / 1000

    if (value.type && value.type.startsWith('touch')) {
      if (!lastValue || !lastValue.touches || !lastValue.touches.length) {
        velocityX = 0
        velocityY = 0
      } else {
        const {clientX: prevX, clientY: prevY} = lastValue.touches[0]
        const {clientX, clientY} = value.touches[0]
        velocityX = (prevX - clientX) / t
        velocityY = (prevY - clientY) / t
      }
    } else if (value.type && value.type.startsWith('mouse')) {
      if (!lastValue) {
        velocityX = 0
        velocityY = 0
      } else {
        const {clientX: prevX, clientY: prevY} = lastValue
        const {clientX, clientY} = value
        velocityX = (prevX - clientX) / t
        velocityY = (prevY - clientY) / t
      }
    } else {
      velocityX = deltaX / t
      velocityY = deltaY / t
    }

    return {velocityX, velocityY}
  }

  static _computeDelta (value, lastValue) {
    let {deltaX, deltaY} = value

    if (value.type && value.type.startsWith('touch')) {
      if (!lastValue || !lastValue.touches || !lastValue.touches.length) {
        deltaX = 0
        deltaY = 0
      } else {
        const {clientX: prevX, clientY: prevY} = lastValue.touches[0]
        const {clientX, clientY} = value.touches[0]
        deltaX = prevX - clientX
        deltaY = prevY - clientY
      }
    } else if (value.type && value.type.startsWith('mouse')) {
      if (!lastValue) {
        deltaX = 0
        deltaY = 0
      } else {
        const {clientX: prevX, clientY: prevY} = lastValue
        const {clientX, clientY} = value
        deltaX = prevX - clientX
        deltaY = prevY - clientY
      }
    }

    return {deltaX, deltaY}
  }

  _next (value) {
    const {_lastValue: lastValue, _lastTime: lastTime} = this
    const time = timeStamp(value)
    const deltaT = lastTime ? time - lastTime : 0
    const delta = this.computeDelta(value, lastValue, deltaT)
    const velocity = this.computeVelocity(value, lastValue, deltaT)

    this._lastValue = value
    this._lastTime = time

    super._next({...delta, ...velocity, deltaT})
  }

  _complete () {
    this._lastValue = null
    this._lastTime = null
    super._complete()
  }
}

export class DeltaOperator {
  constructor (computeDelta) {
    this.computeDelta = computeDelta
  }

  call (subscriber, source) {
    return source._subscribe(new DeltaSubscriber(subscriber, this.computeDelta))
  }
}

export default DeltaOperator
