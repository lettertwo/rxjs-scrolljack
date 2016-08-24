// TODO: Move the min guard for net delta into _next method
import {computeNetDelta, computeMinNetDelta} from './computeNetDelta'
import {createShouldScheduleNext} from './scheduleNext'
import {KinematicSubscriber} from './KinematicSubscriber'
import {KinematicOperator} from './KinematicOperator'

export class AnchorSubscriber extends KinematicSubscriber {

  static initialState = {
    velocity: 0,
    netDelta: 0,
  }

  static shouldScheduleNext = createShouldScheduleNext(
    state => state.velocity !== 0 || state.netDelta !== 0
  )

  static nextValueReducer (value, state, t, droppedFrames = 0) {
    let {netDelta, K, B, P} = state

    let delta = state.toDelta(value)

    let velocity

    // Aggregate deltas over any dropped frames.
    let aggregateDelta = 0

    // Compute the cumulative result of any dropped frames.
    for (let i = 0; i < droppedFrames; i++) {
      // Compute the result of the dropped frame.
      const [nd, nv] = computeNetDelta(netDelta, 0, delta / t, t, K, B, P)
      delta = nd - netDelta
      netDelta = nd
      velocity = nv
      aggregateDelta += delta
    }

    // Compute the result of the current frame.
    const [nd, nv] = computeNetDelta(netDelta, 0, delta / t, t, K, B, P)
    delta = nd - netDelta
    netDelta = nd
    velocity = nv
    aggregateDelta += delta

    // Update state state with current frame results.
    state.netDelta = netDelta
    state.velocity = velocity

    return {...value, ...state.fromDelta(aggregateDelta)}
  }
}

export class AnchorOperator extends KinematicOperator {
  static createSubscriber (...args) {
    return new AnchorSubscriber(...args)
  }
}

export default AnchorOperator
