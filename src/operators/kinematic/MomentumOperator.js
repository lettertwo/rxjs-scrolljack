import {computeNetDelta} from './computeNetDelta'
import {createShouldScheduleNext} from './scheduleNext'
import {KinematicSubscriber} from './KinematicSubscriber'
import {KinematicOperator} from './KinematicOperator'

export class MomentumSubscriber extends KinematicSubscriber {
  static initialState = {
    velocity: 0,
    delta: 0,
  }

  static shouldScheduleNext = createShouldScheduleNext(
    state => state.velocity !== 0
  )

  static start (state) {
    state.stopped = false
  }

  static stop (state) {
    state.stopped = true
  }

  static nextValueReducer (value, state, t, droppedFrames = 0) {
    let {velocity, delta, stopped, K, B, P} = state

    // If we haven't stopped, just pass the value through.
    if (!stopped) {
      state.delta = state.toDelta(value)
      state.velocity = 0.8 * (state.delta / t) + 0.2 * state.velocity
      return value
    }

    let newDelta = velocity * t
    let newVelocity = state.velocity

    // Aggregate deltas over any dropped frames.
    let aggregateDelta = 0

    // Compute the cumulative result of any dropped frames.
    for (let i = 0; i < droppedFrames; i++) {
      // Compute the result of the dropped frame.
      const [nd, nv] = computeNetDelta(delta, newDelta, newVelocity, t, K, B, P)
      delta = newDelta
      newDelta = nd
      newVelocity = nv
      aggregateDelta += newDelta
    }

    // Compute the result of the current frame.
    const [nd, nv] = computeNetDelta(delta, newDelta, velocity, t, K, B, P)
    newDelta = nd
    newVelocity = nv
    aggregateDelta += newDelta

    // Update state state with current frame results.
    state.velocity = newVelocity
    state.delta = newDelta

    return {...value, ...state.fromDelta(aggregateDelta)}
  }
}

export class MomentumOperator extends KinematicOperator {
  static createSubscriber (...args) {
    return new MomentumSubscriber(...args)
  }
}

export default MomentumOperator
