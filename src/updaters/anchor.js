import {KinematicUpdater} from './KinematicUpdater'
import {computeNextValue} from './computeNextValue'
import {parseXOpts, parseYOpts} from './parseOpts'

const F = 1000 / 60  // Default frame rate

class AnchorUpdater extends KinematicUpdater {
  _initSpring (spring) {
    spring.velocity = 0
    spring.netDelta = 0
    spring.droppedDelta = 0
  }

  _catchFrameSpring (value, spring) {
    spring.droppedDelta += spring.toDelta(value)
    spring.velocity = spring.toVelocity(value)
  }

  _updateFrameSpring (value, spring) {
    spring.netDelta += spring.toDelta(value)
    spring.velocity = spring.toVelocity(value)
    spring.droppedDelta = 0
  }

  _computeNextSpring (value, spring) {
    let {stopped} = this
    let {netDelta, droppedDelta, stiffness: K, damping: B, precision: P} = spring

    const t = Math.min(F, Math.max(value.deltaT || 1)) / 1000

    let delta = spring.toDelta(value)

    let velocity
    if (!stopped) {
      velocity = spring.toVelocity(value)
    } else {
      velocity = spring.velocity
    }

    netDelta += droppedDelta

    // Compute the result of the current frame.
    let [nd, nv] = computeNextValue(netDelta, 0, velocity, t, K, B, P)
    let newDelta = nd - netDelta

    // If we're not stopped, make sure the spring doesn't push back
    // in the opposite direction of our velocity.
    if (!stopped && delta && Math.abs(newDelta) > Math.abs(delta)) {
      newDelta = delta + droppedDelta
    }

    return {...value, ...spring.fromDelta(newDelta), ...spring.fromVelocity(nv)}
  }

  _shouldGenerateNextSpring (spring) {
    return spring.velocity !== 0 || spring.netDelta !== 0 || spring.droppedDelta !== 0
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
