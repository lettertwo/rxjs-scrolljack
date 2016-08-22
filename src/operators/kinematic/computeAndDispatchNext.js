import {scheduleNext} from './scheduleNext'

const F = 1000 / 60  // Default frame rate

export const computeAndDispatchNext = state => {
  let {subscriber, time, opts} = state

  const now = state.scheduler.now()
  let deltaT = now - time
  state.time = now

  // If it seems like we've dropped a lot of frames, its probably because
  // this process was backgrounded (switched tabs), so we should restart.
  if (deltaT > F * 10) {
    scheduleNext(state, computeAndDispatchNext)
    return
  }

  // Calculate the number of frames that have been 'dropped' since the
  // last update. Dropped frames are updates that should've happened within
  // a window of time, but didn't, usually because of jank, normalizing
  // optimizations, or other delays introduced by the browser/runtime.
  let droppedFrames = Math.floor(deltaT / F)

  // Subtract dropped frames' duration from the time delta
  // to get the delta for just the latest frame.
  deltaT = deltaT - droppedFrames * F

  // Convert our time delta from ms to s.
  let t = F / 1000

  // Apply the aggregate deltas to the subscriber.
  // FIXME: Invert this loop so its driven by dropped frames, then opts,
  // not opts, then dropped frames.
  subscriber.next(opts.reduce(
    (value, opt) => state.nextValueReducer(value, opt, t, droppedFrames),
    {deltaX: 0, deltaY: 0, deltaT},
  ))

  if (state.shouldScheduleNext(state)) {
    scheduleNext(state, computeAndDispatchNext)
  } else if (state.shouldComplete) {
    state.destination.complete()
  }
}

export default computeAndDispatchNext
