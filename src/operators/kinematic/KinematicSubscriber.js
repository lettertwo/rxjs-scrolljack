import {Subscriber} from 'rxjs/Subscriber'
import {scheduleNext} from './scheduleNext'
import {computeAndDispatchNext} from './computeAndDispatchNext'

const F = 1000 / 60  // Default frame rate

export class KinematicSubscriber extends Subscriber {
  constructor (destination, opts, startSource, stopSource, scheduler) {
    super(destination)
    this.scheduler = scheduler
    this.startCount = 0

    this.state = {
      scheduler,
      subscriber: this.destination,
      shouldComplete: false,
      subscription: null,
      shouldScheduleNext: this.constructor.shouldScheduleNext,
      nextValueReducer: this.constructor.nextValueReducer,
      time: null,
      opts: opts.map(a => ({
        ...this.constructor.initialState,
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
    super._next(opts.reduce(
      (value, opt) => this.constructor.nextValueReducer(value, opt, t),
      value,
    ))
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
      if (this.constructor.shouldScheduleNext(this.state)) {
        this.scheduled = scheduleNext(this.state, computeAndDispatchNext)
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

  // The subclass 'contract' is comprised of these static members.
  static initialState = {}

  static shouldScheduleNext () {
    throw new Error('KinematicSubscriber is a base class, and should not be used directly.')
  }

  static nextValueReducer () {
    throw new Error('KinematicSubscriber is a base class, and should not be used directly.')
  }
}

export default KinematicSubscriber
