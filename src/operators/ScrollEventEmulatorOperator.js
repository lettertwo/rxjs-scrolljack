import {Subscriber} from 'rxjs/Subscriber'
import {async} from 'rxjs/scheduler/async'
import {SCROLL_START, SCROLL_MOVE, SCROLL_END} from '../events'
import {EmulatedUIEvent} from '../events/EmulatedUIEvent'

const SCROLL_STOP_DELAY = 60

const dispatchStop = subscriber => { subscriber.stopNow() }

export class ScrollEventEmulatorOperator {
  call (subscriber, source) {
    return source._subscribe(
      new ScrollEventEmulatorSubcriber(subscriber)
    )
  }
}

export default ScrollEventEmulatorOperator

class ScrollEventEmulatorSubcriber extends Subscriber {
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
    }
    this.scheduleStop()
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
      this.dispatch(new EmulatedUIEvent(this._lastValue, SCROLL_START))
    }
    this.moveNow()
  }

  moveNow () {
    this.dispatch(new EmulatedUIEvent(this._lastValue, SCROLL_MOVE))
  }

  stopNow () {
    this.cancelStop()
    this.moveNow()
    if (this._started) {
      this._started = false
      this.dispatch(new EmulatedUIEvent(this._lastValue, SCROLL_END))
    }
  }

  dispatch (value) {
    super._next(value)
  }
}
