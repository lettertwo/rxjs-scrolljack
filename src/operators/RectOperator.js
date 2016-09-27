import {Subscriber} from 'rxjs/Subscriber'

export class RectOperator {
  constructor (bounds, initialValue) {
    this.bounds = bounds
    this.initialValue = initialValue
  }

  call (subscriber, source) {
    const {bounds, initialValue} = this
    return source._subscribe(new RectSubscriber(subscriber, bounds, initialValue))
  }
}

export default RectOperator

export class RectSubscriber extends Subscriber {
  constructor (destination, bounds, initialValue = {}) {
    super(destination)
    const {deltaX = 0, deltaY = 0} = initialValue
    this.netX = deltaX
    this.netY = deltaY
    this.minX = bounds.x || 0
    this.maxX = this.minX + (bounds.width || 0)
    this.minY = bounds.y || 0
    this.maxY = this.minY + (bounds.height || 0)
  }

  _next (value) {
    const {netX, netY, minX, maxX, minY, maxY} = this
    const newNetX = netX + value.deltaX
    const newNetY = netY + value.deltaY

    let {deltaX: newDeltaX, deltaY: newDeltaY} = value
    let outOfBounds = false

    if (newNetX < minX) {
      outOfBounds = true
      newDeltaX -= newNetX - minX
    } else if (newNetX > maxX) {
      outOfBounds = true
      newDeltaX -= newNetX - maxX
    }

    if (newNetY < minY) {
      outOfBounds = true
      newDeltaY -= newNetY - minY
    } else if (newNetY > maxY) {
      outOfBounds = true
      newDeltaY -= newNetY - maxY
    }

    if (outOfBounds) {
      value = {...value, deltaX: newDeltaX, deltaY: newDeltaY}
    }

    this.netX += value.deltaX
    this.netY += value.deltaY

    super._next(value)
  }
}
