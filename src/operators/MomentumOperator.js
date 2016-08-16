import {Subscriber} from 'rxjs/Subscriber'
import {animationFrame} from 'rxjs/scheduler/animationFrame'
import {velocity, dampedVelocity, displacement} from '../kinematics'

const FRAME_RATE = 1000 / 60
const PRECISION = 0.01

export class MomentumSubscriber extends Subscriber {
  constructor (destination, startSource, stopSource, scheduler) {
    super(destination)
    this.lastValue = null
    this.lastVelocityX = 0
    this.lastVelocityY = 0
    this.startCount = 0

    this.scheduler = scheduler

    this.startSource = startSource
    this.startSub = this.startSource.subscribe(this.start)
    this.add(this.startSub)

    this.stopSource = stopSource
    this.stopSub = this.stopSource.subscribe(this.stop)
    this.add(this.stopSub)
  }

  _next (value) {
    this.cancelNext()

    const {deltaX: dx, deltaY: dy, deltaT: dt} = value
    const vx = velocity(dx, dt)
    const vy = velocity(dy, dt)

    this.lastValue = value
    this.lastVelocityX = vx
    this.lastVelocityY = vy

    super._next(value)
  }

  _complete () {
    this.unsub()
    this.stop(null, true)
  }

  start = () => {
    this.startCount++
    this.cancelNext()
  }

  stop = (_, shouldComplete) => {
    this.startCount--

    if (shouldComplete || this.startCount <= 0) {
      this.cancelNext()
      this.startCount = 0

      if (!this.lastValue) {
        this.lastVelocityX = 0
        this.lastVelocityY = 0

        if (shouldComplete) {
          this.destination.complete()
        }
      } else {
        const {
          lastValue: {deltaX, deltaY},
          lastVelocityX: vx,
          lastVelocityY: vy,
        } = this

        this.lastValue = null
        this.lastVelocityX = 0
        this.lastVelocityY = 0

        if (Math.abs(vx) > PRECISION || Math.abs(vy) > PRECISION) {
          this.scheduleNext(deltaX, deltaY, vx, vy, shouldComplete)
        } else if (shouldComplete) {
          this.destination.complete()
        }
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
  }

  scheduleNext (dx, dy, vx, vy, shouldComplete) {
    const {scheduler} = this

    this.scheduled = scheduler.schedule(
      MomentumSubscriber.computeAndDispatchNext,
      FRAME_RATE,
      {
        vx, vy, dx, dy,
        shouldComplete,
        subscriber: this.destination,
        time: scheduler.now(),
      },
    )
    this.add(this.scheduled)
  }

  static computeAndDispatchNext (state) {
    let {subscriber, shouldComplete, time, vx, vy, dx, dy} = state

    const now = this.scheduler.now()
    const deltaT = now - time
    const dt = deltaT / 1000

    const nvx = dampedVelocity(dx, vx, dt)
    const nvy = dampedVelocity(dy, vy, dt)

    const deltaX = displacement(dx, nvx, dt)
    const deltaY = displacement(dy, nvy, dt)

    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) > PRECISION) {
      subscriber.next({
        deltaX: Math.round(deltaX),
        deltaY: Math.round(deltaY),
        deltaT,
      })

      state.vx = nvx
      state.vy = nvy
      state.dx = deltaX
      state.dy = deltaY
      state.time = now
      this.schedule(state, FRAME_RATE)
    } else if (shouldComplete) {
      subscriber.complete()
    }
  }
}

export class MomentumOperator {
  constructor (startSource, stopSource, scheduler = animationFrame) {
    this.startSource = startSource
    this.stopSource = stopSource
    this.scheduler = scheduler
  }
  call (subscriber, source) {
    return source._subscribe(new MomentumSubscriber(
      subscriber,
      this.startSource,
      this.stopSource,
      this.scheduler,
    ))
  }
}

export default MomentumOperator
