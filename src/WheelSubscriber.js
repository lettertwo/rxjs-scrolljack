import {Subscriber} from 'rxjs/Subscriber'
import {async} from 'rxjs/scheduler/async'

const SCROLL_STOP_DELAY = 60

export class WheelSubscriber extends Subscriber {
  constructor (destination) {
    super(destination)
    this._started = false
    this._ignoring = false
    this._lastValue
  }

  _next (value) {
    const {_lastValue: lastValue} = this
    this._lastValue = value
    const {deltaX, deltaY, deltaT} = value

    if (!this._started) {
      if (!this._ignoring) {
        if (deltaT || !lastValue) {
          this.startNow()
          this.moveNow()
          if (deltaX || deltaY) {
            this.scheduleStop()
          }
        } else {
          this._ignoring = true
          this.scheduleStop()
        }
      } else {
        if (!deltaX && !deltaY) {
          this.stopNow()
        } else {
          this.scheduleStop()
        }
      }
    } else {
      if (!deltaX && !deltaY) {
        this.stopNow()
      } else {
        this.moveNow()
        if (this.scheduled) {
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
      this._start(this._lastValue)
    }
  }

  moveNow () {
    this._move(this._lastValue)
  }

  stopNow () {
    this.cancelStop()
    if (this._ignoring) {
      this._ignoring = false
    }
    if (this._started) {
      this._started = false
      this._stop(this._lastValue)
    }
  }

  dispatch (value) {
    super._next(value)
  }

  _start () { /* noop */ }

  _move () { /* noop */ }

  _stop () { /* noop */ }
}

const dispatchStop = subscriber => { subscriber.stopNow() }

export default WheelSubscriber
