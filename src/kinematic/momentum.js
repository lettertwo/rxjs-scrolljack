import {KinematicUpdater} from './KinematicUpdater'
import {computeNextValue} from './computeNextValue'
import {parseXOpts, parseYOpts} from './parseOpts'

class MomentumUpdater extends KinematicUpdater {
  _initSpring (spring) {
    spring.velocity = 0
    spring.lastDelta = 0
  }

  _startSpring (spring) {
    // Reset net delta on start.
    spring.lastDelta = 0
  }

  _updateFrameSpring (value, spring) {
    if (this.stopped) {
      spring.lastDelta = spring.toDelta(value)
    }
    spring.velocity = spring.toVelocity(value)
  }

  _computeNextSpring (value, spring) {
    // If we haven't stopped, just pass the value through.
    if (!this.stopped) return value

    const t = value.deltaT / 1000
    let {lastDelta, velocity, stiffness: K, damping: B, precision: P} = spring

    // Compute the result of the current frame.
    let [nd, nv] = computeNextValue(lastDelta, 0, velocity, t, K, B, P)

    return {...value, ...spring.fromDelta(nd), ...spring.fromVelocity(nv)}
  }

  _shouldGenerateNextSpring (spring) {
    return spring.velocity !== 0
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
