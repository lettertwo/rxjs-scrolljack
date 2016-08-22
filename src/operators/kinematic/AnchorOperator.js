import {Subscriber} from 'rxjs/Subscriber'
import {animationFrame} from 'rxjs/scheduler/animationFrame'
import {computeNetDelta, computeMinNetDelta} from './computeNetDelta'
import {scheduleNext, createShouldScheduleNext} from './scheduleNext'
import {parseOptsArray} from './parseOpts'

const F = 1000 / 60  // Default frame rate

const shouldScheduleNext = createShouldScheduleNext(
  opt => opt.velocity !== 0 || opt.netDelta !== 0
)

export class AnchorSubscriber extends Subscriber {
  constructor (destination, opts, startSource, stopSource, scheduler) {
    super(destination)
    this.scheduler = scheduler
    this.startCount = 0

    this.state = {
      scheduler,
      subscriber: this.destination,
      shouldComplete: false,
      subscription: null,
      time: null,
      opts: opts.map(a => ({
        velocity: 0,
        netDelta: 0,
        delta: 0,
        fromDelta: a.fromDelta,
        toDelta: a.toDelta,
        K: a.stiffness,
        B: a.damping,
        P: a.precision,
      })),
    }

    this.startSource = startSource
    this.startSub = this.startSource.subscribe(this.start)
    this.add(this.startSub)

    this.stopSource = stopSource
    this.stopSub = this.stopSource.subscribe(this.stop)
    this.add(this.stopSub)
  }

  _next (value) {
    this.cancelNext()
    const {opts} = this.state
    const t = Math.min(Math.max(value.deltaT, 1), F) / 1000
    super._next(opts.reduce(AnchorSubscriber.createNextValueReducer(t), value))
  }

  _complete () {
    this.unsub()
    this.state.shouldComplete = true
    this.stop()
  }

  start = () => {
    this.startCount++
    this.cancelNext()
  }

  stop = () => {
    this.startCount--
    this.cancelNext()

    if (this.state.shouldComplete || this.startCount <= 0) {
      if (shouldScheduleNext(this.state)) {
        this.scheduled = scheduleNext(this.state, AnchorSubscriber.computeAndDispatchNext)
        if (this.scheduled) this.add(this.scheduled)
      } else if (this.state.shouldComplete) {
        this.state.destination.complete()
        this.state = null
      }
    }
  }

  unsub () {
    if (this.startSub) {
      this.remove(this.startSub)
      this.startSub.unsubscribe()
      this.startSub = null
    }
    if (this.stopSub) {
      this.remove(this.stopSub)
      this.stopSub.unsubscribe()
      this.stopSub = null
    }
  }

  cancelNext () {
    if (this.scheduled) {
      this.remove(this.scheduled)
      this.scheduled.unsubscribe()
      this.scheduled = null
    }
    if (this.state.subscription) {
      this.state.subscription.unsubscribe()
      this.state.subscription = null
    }
  }

  static computeAndDispatchNext (state) {
    let {subscriber, time, opts} = state

    const now = state.scheduler.now()
    let deltaT = now - time
    state.time = now

    // If it seems like we've dropped a lot of frames, its probably because
    // this process was backgrounded (switched tabs), so we should restart.
    if (deltaT > F * 10) {
      scheduleNext(state, AnchorSubscriber.computeAndDispatchNext)
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
    subscriber.next(opts.reduce(
      AnchorSubscriber.createNextValueReducer(t, droppedFrames),
      {deltaX: 0, deltaY: 0, deltaT},
    ))

    if (shouldScheduleNext(state)) {
      scheduleNext(state, AnchorSubscriber.computeAndDispatchNext)
    } else if (state.shouldComplete) {
      state.destination.complete()
    }
  }

  static createNextValueReducer (t, droppedFrames = 0) {
    return (value, anchor) => {
      let {netDelta, K, B, P} = anchor

      let delta = anchor.toDelta(value) || anchor.delta

      let velocity

      // Aggregate deltas over any dropped frames.
      let aggregateDelta = 0

      // Compute the cumulative result of any dropped frames.
      for (let i = 0; i < droppedFrames; i++) {
        // Compute the result of the dropped frame.
        const [newNetDelta, newVelocity] = computeNetDelta(netDelta, delta / t, t, K, B, P)
        delta = newNetDelta - netDelta
        netDelta = newNetDelta
        velocity = newVelocity
        aggregateDelta += delta
      }

      // Compute the result of the current frame.
      const [newNetDelta, newVelocity] = computeNetDelta(netDelta, delta / t, t, K, B, P)
      delta = newNetDelta - netDelta
      netDelta = newNetDelta
      velocity = newVelocity
      aggregateDelta += delta

      // Update anchor state with current frame results.
      anchor.delta = delta
      anchor.netDelta = netDelta
      anchor.velocity = velocity

      return {...value, ...anchor.fromDelta(aggregateDelta)}
    }
  }
}

export class AnchorOperator {
  constructor (opts, startSource, stopSource, scheduler = animationFrame) {
    this.opts = parseOptsArray(opts)
    this.startSource = startSource
    this.stopSource = stopSource
    this.scheduler = scheduler
  }

  call (subscriber, source) {
    return source._subscribe(new AnchorSubscriber(
      subscriber,
      this.opts,
      this.startSource,
      this.stopSource,
      this.scheduler,
    ))
  }
}

export default AnchorOperator
