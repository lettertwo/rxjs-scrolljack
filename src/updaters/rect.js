import {KinematicUpdater} from './KinematicUpdater'
import {parseXOpts, parseYOpts} from './parseOpts'

class RectUpdater extends KinematicUpdater {
  _initSpring (spring, opts) {
    spring.netDelta = 0
    spring.minNetDelta = spring.minNetDelta || 0
    spring.maxNetDelta = spring.maxNetDelta || 0
  }

  _updateFrameSpring (value, spring) {
    spring.netDelta += spring.toDelta(value)
  }

  _computeNextSpring (value, spring) {
    let newDelta = spring.toDelta(value)
    const {netDelta, minNetDelta, maxNetDelta} = spring
    const newNetDelta = netDelta + newDelta

    let outOfBounds = false

    if (newNetDelta < minNetDelta) {
      outOfBounds = true
      newDelta -= newNetDelta - minNetDelta
    } else if (newNetDelta > maxNetDelta) {
      outOfBounds = true
      newDelta -= newNetDelta - maxNetDelta
    }

    if (!outOfBounds) return value

    const v = {
      ...value,
      ...spring.fromDelta(newDelta),
    }

    return v
  }

  _shouldGenerateNextSpring (spring) {
    return spring.netDelta > spring.maxNetDelta || spring.netDelta < spring.minNetDelta
  }
}

export const rectX = (opts, ...args) =>
  new RectUpdater([parseXOpts(opts)], ...args)

export const rectY = (opts, ...args) =>
  new RectUpdater([parseYOpts(opts)], ...args)

export const rect = (opts, ...args) =>
  new RectUpdater([parseXOpts(opts), parseYOpts(opts)], ...args)

rect.x = rectX
rect.y = rectY

export default rect
