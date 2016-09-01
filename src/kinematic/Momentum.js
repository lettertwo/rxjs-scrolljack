import {Kinematic} from './Kinematic'
import {KinematicUpdater} from './KinematicUpdater'
import {computeNextValue} from './computeNextValue'

class MomentumUpdater extends KinematicUpdater {
  _init (spring) {
    spring.velocity = 0
    spring.netDelta = 0
  }

  _start (spring) {
    spring.velocity = 0
    spring.netDelta = 0
  }

  _update (value, spring) {
    let {stopped} = this

    if (!value.deltaT) {
      spring.velocity = 0.2 * spring.velocity
      return value
    }

    const t = value.deltaT / 1000

    let delta = spring.toDelta(value)

    // If we haven't stopped, just pass the value through.
    if (!stopped) {
      spring.velocity = delta / t
      spring.netDelta = 0
      return value
    }

    let {netDelta, velocity, stiffness: K, damping: B, precision: P} = spring

    // Compute the result of the current frame.
    let [nd, nv] = computeNextValue(netDelta, 0, velocity, t, K, B, P)

    // Update spring spring with current frame results.
    spring.netDelta = nd
    spring.velocity = nv
    spring.droppedDelta = 0

    return {...value, ...spring.fromDelta(nd)}
  }

  _shouldScheduleNext (spring) {
    return spring.velocity !== 0
  }
}

export class Momentum extends Kinematic {
  static createUpdater (...args) {
    return new MomentumUpdater(...args)
  }
}

export default Momentum
