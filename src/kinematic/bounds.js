import {KinematicUpdater} from './KinematicUpdater'
import {parseBoundsXOpts, parseBoundsYOpts} from './parseOpts'

const F = 1000 / 60  // Default frame rate

class BoundsUpdater extends KinematicUpdater {
  _initSpring (spring) {
    spring.netDelta = spring.min
  }

  _updateFrameSpring (value, spring) {
    spring.netDelta += spring.toDelta(value)
  }

  _computeNextSpring (value, spring) {
    let {netDelta} = spring
    let newDelta = spring.toDelta(value)

    netDelta += newDelta

    if (netDelta < spring.min) {
      newDelta -= netDelta - spring.min
      netDelta = spring.min
    } else if (netDelta > spring.max) {
      newDelta -= netDelta - spring.max
      netDelta = spring.max
    }

    return {...value, ...spring.fromDelta(newDelta)}
  }
}

export const bounds = (opts, ...args) =>
  new BoundsUpdater([parseBoundsXOpts(opts), parseBoundsYOpts(opts)], ...args)

export default bounds
