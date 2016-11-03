import {KinematicUpdater} from './KinematicUpdater'
import {computeNextValue} from './computeNextValue'
import {parseXOpts, parseYOpts} from './parseOpts'

const F = 1000 / 60  // Default frame rate

class AnchorUpdater extends KinematicUpdater {
  _initSpring (spring) {
    spring.velocity = 0
    spring.netDelta = 0
  }

  _updateFrameSpring (value, spring) {
    spring.netDelta += spring.toDelta(value)
    spring.velocity = spring.toVelocity(value)
  }

  _computeNextSpring (value, spring) {
    let {stopped} = this
    let {netDelta, velocity, stiffness: K, damping: B, precision: P} = spring

    // If we're not stopped, add velocity from input
    // to the residual velocity from the last update.
    if (!stopped) {
      velocity += spring.toVelocity(value)
    }

    const t = Math.min(F, Math.max(value.deltaT || 1)) / 1000

    // Compute the result of the current frame.
    let [newNetDelta, newVelocity] = computeNextValue(netDelta, 0, velocity, t, K, B, P)
    let newDelta = 0

    // If we're not stopped, make sure the spring doesn't push back
    // in the opposite direction of our velocity.
    if (!stopped) {
      const sameDirection = velocity === spring.velocity ||
        (velocity > 0 && spring.velocity > 0) ||
        (velocity < 0 && spring.velocity < 0)

      if (sameDirection && Math.abs(newNetDelta) < Math.abs(netDelta)) {
        newVelocity = velocity
      } else {
        newDelta = newNetDelta - netDelta
      }
    } else {
      newDelta = newNetDelta - netDelta
    }

    return {
      ...value,
      ...spring.fromDelta(newDelta),
      ...spring.fromVelocity(newVelocity),
    }
  }

  _shouldGenerateNextSpring (spring) {
    return spring.velocity !== 0 || spring.netDelta !== 0
  }
}

export const anchorX = (opts, ...args) =>
  new AnchorUpdater([parseXOpts(opts)], ...args)

export const anchorY = (opts, ...args) =>
  new AnchorUpdater([parseYOpts(opts)], ...args)

export const anchor = (opts, ...args) =>
  new AnchorUpdater([parseXOpts(opts), parseYOpts(opts)], ...args)

anchor.x = anchorX
anchor.y = anchorY

export default anchor
