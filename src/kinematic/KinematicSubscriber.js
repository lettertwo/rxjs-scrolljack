import {Subscriber} from 'rxjs/Subscriber'

const F = 1000 / 60  // Default frame rate

/**
 * A base Subscriber class for Kinematic Observables.
 */
export class KinematicSubscriber extends Subscriber {
  constructor (destination, startSource, stopSource, updater, scheduler) {
    super(destination)
    this.startCount = 0
    this.scheduler = scheduler

    this.updater = updater
    this.updater.setDestination(destination)

    this.startSub = startSource.subscribe(this.start)
    this.add(this.startSub)

    this.stopSub = stopSource.subscribe(this.stop)
    this.add(this.stopSub)
  }

  _next (value) {
    this.cancelNext()

    KinematicSubscriber.computeAndUpdateNextValue(
      this.updater,
      value,
      this.scheduler,
    )
  }

  _complete () {
    this.unsub()
    this.updater.shouldComplete = true
    this.stop()
  }

  start = () => {
    this.startCount++

    if (!this.updater.shouldComplete && this.startCount === 1) {
      this.cancelNext()
      this.updater.start()
    }
  }

  stop = () => {
    this.startCount--

    if (this.updater.shouldComplete || this.startCount === 0) {
      this.cancelNext()
      this.updater.stop()

      if (this.updater.shouldScheduleNext()) {
        this.scheduleNext()
      } else if (this.updater.shouldComplete) {
        this.destination.complete()
        this.updater = null
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
    if (this.scheduled && !this.scheduled.isUnsubscribed) {
      this.scheduled.unsubscribe()
      this.scheduled = null
    }
  }

  scheduleNext () {
    let shouldSchedule = !this.scheduled || !this.scheduled.isUnsubscribed

    if (shouldSchedule) {
      if (!this.updater.time) this.updater.time = this.scheduler.now()

      const subscription = this.scheduler.schedule(
        KinematicSubscriber.computeAndUpdateNextValue,
        0,
        this.updater,
      )

      if (!this.scheduled) {
        this.scheduled = subscription
        this.add(this.scheduled)
      } else {
        this.scheduled.add(subscription)
      }
    }
  }

  static computeAndUpdateNextValue (updater, value = {}, scheduler = this.scheduler) {
    const now = scheduler.now()

    let {
      deltaX = 0,
      deltaY = 0,
      deltaT = now - updater.time,
    } = value

    // If we're scheduled, (animating), and it seems like we've dropped
    // a lot of frames, its probably because this process was backgrounded
    // (switched tabs), so we should restart.
    if (typeof this.schedule === 'function' && deltaT > F * 10) {
      updater.time = now
      this.schedule(updater, 0)
      return
    }

    // Calculate the number of frames that have been 'dropped' since the
    // last update. Dropped frames are updates that should've happened within
    // a window of time, but didn't, usually because of jank, normalizing
    // optimizations, or other delays introduced by the user/browser/runtime.
    let droppedFrames = Math.floor(deltaT / F)

    if (droppedFrames) {
      const droppedValue = {
        deltaX: deltaX / (droppedFrames + 1),
        deltaY: deltaY / (droppedFrames + 1),
        deltaT: F,
      }
      // Subtract dropped frames' deltas from the original deltas
      // to get the deltas for just the latest frame.
      deltaX = deltaX - droppedValue.deltaX * droppedFrames
      deltaY = deltaY - droppedValue.deltaY * droppedFrames
      deltaT = deltaT - droppedValue.deltaT * droppedFrames

      // Apply the dropped frame deltas to the destination.
      for (let i = 0; i < droppedFrames; i++) {
        updater.catchFrame(droppedValue)
      }
    }

    updater.update({deltaX, deltaY, deltaT})
    updater.time = now

    // If we're scheduled (animating), and
    // we should schedule another update, schedule it.
    if (typeof this.schedule === 'function' && updater.shouldScheduleNext()) {
      this.schedule(updater, 0)
    } else if (updater.shouldComplete) {
      updater.destination.complete()
    }
  }
}

export default KinematicSubscriber
