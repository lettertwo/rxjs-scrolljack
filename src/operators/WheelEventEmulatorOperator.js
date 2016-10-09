/* global WheelEvent */
import {Subscriber} from 'rxjs/Subscriber'
import {async} from 'rxjs/scheduler/async'
import {timeStamp, supportsNewEvent} from '../utils'
import {WHEEL_START, WHEEL_MOVE, WHEEL_END} from '../events'

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
    this._ignoring = false
    this._lastValue
    this._lastTime
  }

  _next (value) {
    const time = timeStamp(value)
    const {_lastValue: lastValue, _lastTime: lastTime} = this
    const {deltaX, deltaY} = value
    const deltaT = lastTime ? time - lastTime : 0

    this._lastValue = value
    this._lastTime = time

    if (!this._started) {
      if (!this._ignoring) {
        if (deltaT || !lastValue) {
          // We haven't started yet, and we're not ignoring updates, and we
          // either have a time delta or haven't updated before, so start
          // updating now.
          this.startNow()

          if (deltaX || deltaY) {
            // We're now started, and we have a delta,
            // so move on it and schedule a stop timeout.
            this.moveNow()
            this.scheduleStop()
          }
        } else {
          // We haven't started yet, but this isn't our first update,
          // and we don't have a time delta, so start ignoring updates
          // and schedule a stop timeout.
          this._ignoring = true
          this.scheduleStop()
        }
      } else {
        if (!deltaX && !deltaY) {
          // We haven't started yet, and we're ignoring updates,
          // and we don't have a delta, so stop now!
          this.stopNow()
        } else {
          // We haven't started yet, and we're ignoring updates,
          // but we do have a delta, so schedule a stop timeout.
          this.scheduleStop()
        }
      }
    } else {
      if (!deltaX && !deltaY) {
        // We have started, and we don't have a delta, so stop now!
        this.stopNow()
      } else {
        // We have started, and we have a delta, so move on it.
        this.moveNow()
        if (this.scheduled) {
          // We have a stop scheduled, but we just moved on a delta,
          // so reschedule it for later.
          this.scheduleStop()
        }
      }
    }
  }

  _complete () {
    super._complete()
    this.cancelStop()
    this._started = false
    this._ignoring = false
    this._lastValue = null
  }

  cancelStop () {
    if (this.scheduled) {
      this.remove(this.scheduled)
      this.scheduled.unsubscribe()
      this.scheduled = null
    }
  }

  scheduleStop () {
    this.cancelStop()
    this.scheduled = async.schedule(dispatchStop, SCROLL_STOP_DELAY, this)
    this.add(this.scheduled)
  }

  startNow () {
    if (!this._started) {
      this._started = true
      this.dispatch(createWheelEventFrom(this._lastValue, WHEEL_START))
    }
  }

  moveNow () {
    this.dispatch(createWheelEventFrom(this._lastValue, WHEEL_MOVE))
  }

  stopNow () {
    this.cancelStop()
    if (this._ignoring) {
      this._ignoring = false
    }
    if (this._started) {
      this._started = false
      this.dispatch(createWheelEventFrom(this._lastValue, WHEEL_END))
    }
  }

  dispatch (value) {
    super._next(value)
  }
}

const createWheelEventFrom = (value, type) => {
  if (supportsNewEvent()) {
    return new WheelEvent(type, value)
  } else {
    return createOldWheelEventFrom(value, type)
  }
}

const createOldWheelEventFrom = (value, type) => {
  const {view, detail, screenX, screenY, clientX, clientY, button, relatedTarget, deltaX, deltaY, deltaZ, deltaMode} = value
  const initArgs = [view, detail, screenX, screenY, clientX, clientY, button, relatedTarget, null, deltaX, deltaY, deltaZ, deltaMode]
  const event = document.createEvent('WheelEvent')
  event.initWheelEvent(type, true, true, ...initArgs)
  return event
}
