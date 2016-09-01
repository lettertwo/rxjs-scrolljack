import {Kinematic} from './Kinematic'
import {KinematicUpdater} from './KinematicUpdater'
import {computeNextValue} from './computeNextValue'

class AnchorUpdater extends KinematicUpdater {

  _init (spring) {
    spring.velocity = 0
    spring.netDelta = 0
    spring.droppedDelta = 0
  }

  stop () {
    this.time = null
    super.stop()
  }

  _catchFrame (value, spring) {
    if (this.stopped) {
      const nv = super._catchFrame(value, spring)
      spring.droppedDelta = spring.toDelta(nv)
    } else {
      spring.droppedDelta = 0
    }
  }

  _update (value, spring) {
    let {stopped} = this
    let {netDelta, droppedDelta, stiffness: K, damping: B, precision: P} = spring

    const t = (value.deltaT || 1) / 1000

    const initialNetDelta = netDelta

    let delta = spring.toDelta(value)
    let velocity
    if (!stopped) {
      velocity = delta / t
    } else {
      velocity = spring.velocity
    }

    netDelta += droppedDelta

    // Compute the result of the current frame.
    let [nd, nv] = computeNextValue(netDelta, 0, velocity, t, K, B, P)
    let newDelta = (nd - initialNetDelta) + droppedDelta

    // If we're not stopped, make sure the spring doesn't push back
    // in the opposite direction of our velocity.
    if (!stopped && delta && Math.abs(newDelta) > Math.abs(delta)) {
      newDelta = delta + droppedDelta
      nd = initialNetDelta + newDelta
      nv = velocity
    }

    // Update spring spring with current frame results.
    spring.netDelta = nd
    spring.velocity = nv
    spring.droppedDelta = 0

    return {...value, ...spring.fromDelta(newDelta)}
  }

  _shouldScheduleNext (spring) {
    return spring.velocity !== 0 || spring.netDelta !== 0 || spring.droppedDelta !== 0
  }
}

export class Anchor extends Kinematic {
  static createUpdater (...args) {
    return new AnchorUpdater(...args)
  }
}

export default Anchor
