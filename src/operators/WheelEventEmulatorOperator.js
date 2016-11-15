import {Subscriber} from 'rxjs/Subscriber'
import {async} from 'rxjs/scheduler/async'
import {WHEEL_START, WHEEL_MOVE, WHEEL_END} from '../events'
import {EmulatedWheelEvent} from '../events/EmulatedWheelEvent'

const SCROLL_STOP_DELAY = 60

const dispatchStop = subscriber => { subscriber.stopNow() }

export class WheelEventEmulatorOperator {
  call (subscriber, source) {
    return source._subscribe(
      new WheelEventEmulatorSubcriber(subscriber)
    )
  }
}

export default WheelEventEmulatorOperator

class WheelEventEmulatorSubcriber extends Subscriber {
  constructor (destination) {
    super(destination)
    this._started = false
    this._lastValue
  }

  _next (value) {
    this._lastValue = value

    if (!this._started) {
      this.startNow()
    } else {
      this.moveNow()
      this.scheduleStop()
    }
  }

  _complete () {
    super._complete()
    this.cancelStop()
    this._started = false
    this._lastValue = null
  }

  cancelStop () {
    if (this._scheduled) {
      this.remove(this._scheduled)
      this._scheduled.unsubscribe()
      this._scheduled = null
    }
  }

  scheduleStop () {
    this.cancelStop()
    this._scheduled = async.schedule(dispatchStop, SCROLL_STOP_DELAY, this)
    this.add(this._scheduled)
  }

  startNow () {
    if (!this._started) {
      this._started = true
      this.dispatch(new EmulatedWheelEvent(this._lastValue, WHEEL_START))
    }
    this.moveNow()
  }

  moveNow () {
    this.dispatch(new EmulatedWheelEvent(this._lastValue, WHEEL_MOVE))
  }

  stopNow () {
    this.cancelStop()
    this.moveNow()
    if (this._started) {
      this._started = false
      this.dispatch(new EmulatedWheelEvent(this._lastValue, WHEEL_END))
    }
  }

  dispatch (value) {
    super._next(value)
  }
}
