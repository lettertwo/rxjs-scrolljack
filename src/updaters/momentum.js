import {KinematicUpdater} from './KinematicUpdater'
import {computeNextValue} from './computeNextValue'
import {parseXOpts, parseYOpts} from './parseOpts'

class MomentumUpdater extends KinematicUpdater {
  _initSpring (spring, initialValue) {
    if (initialValue) {
      spring.lastVelocity = spring.toVelocity(initialValue)
    } else {
      spring.lastVelocity = 0
    }
  }

  _computeNextSpring (value, spring) {
    // If we've not stopped yet, just pass the value through.
    if (!this.stopped) {
      spring.lastVelocity = spring.toVelocity(value)
      return value
    }

    const delta = spring.toDelta(value)
    const velocity = spring.toVelocity(value)

    const t = value.deltaT / 1000
    const {stiffness: K, damping: B, precision: P} = spring

    // Compute the result of the current frame.
    const [nd, nv] = computeNextValue(delta, 0, velocity, t, K, B, P)

    spring.lastVelocity = nv

    return {...value, ...spring.fromDelta(nd), ...spring.fromVelocity(nv)}
  }

  _shouldGenerateNextSpring (spring) {
    return spring.lastVelocity !== 0
  }
}

export const momentumX = (opts, ...args) =>
  new MomentumUpdater([parseXOpts(opts)], ...args)

export const momentumY = (opts, ...args) =>
  new MomentumUpdater([parseYOpts(opts)], ...args)

export const momentum = (opts, ...args) =>
  new MomentumUpdater([parseXOpts(opts), parseYOpts(opts)], ...args)

momentum.x = momentumX
momentum.y = momentumY

export default momentum
