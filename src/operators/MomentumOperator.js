import {Subscriber} from 'rxjs/Subscriber'
import {animationFrame} from 'rxjs/scheduler/animationFrame'
import {velocity, dampedVelocity, displacement} from '../kinematics'

const FRAME_RATE = 1000 / 60
const PRECISION = 1

export class MomentumSubscriber extends Subscriber {
  constructor (destination, scheduler) {
    super(destination)
    this.scheduler = scheduler
  }

  _next (value) {
    this.cancelNext()
    super._next(value)

    const {deltaX: dx, deltaY: dy, deltaT: dt} = value
    const vx = velocity(dx, dt)
    const vy = velocity(dy, dt)

    if (Math.abs(vx) > PRECISION || Math.abs(vy) > PRECISION) {
      this.scheduleNext(dx, dy, vx, vy)
    }
  }

  _complete () {
    this.cancelNext()
    return super._complete()
  }

  cancelNext () {
    if (this.scheduled) {
      this.remove(this.scheduled)
      this.scheduled.unsubscribe()
      this.scheduled = null
    }
  }

  scheduleNext (dx, dy, vx, vy) {
    const {scheduler} = this

    this.scheduled = scheduler.schedule(
      MomentumSubscriber.computeNext,
      FRAME_RATE,
      {subscriber: this.destination, time: scheduler.now(), vx, vy, dx, dy},
    )
    this.add(this.scheduled)
  }

  static computeNext (state) {
    let {subscriber, time, vx, vy, dx, dy} = state

    const now = this.scheduler.now()
    const deltaT = now - time
    const dt = deltaT / 1000

    const nvx = dampedVelocity(dx, vx, dt)
    const nvy = dampedVelocity(dy, vy, dt)

    const deltaX = displacement(dx, nvx, dt)
    const deltaY = displacement(dy, nvy, dt)

    if (deltaX || deltaY) {
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
    }
  }
}

export class MomentumOperator {
  constructor (scheduler = animationFrame) {
    this.scheduler = scheduler
  }
  call (subscriber, source) {
    return source._subscribe(new MomentumSubscriber(subscriber, this.scheduler))
  }
}
