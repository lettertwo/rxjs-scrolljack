import {Subscriber} from 'rxjs/Subscriber'
import {timeStamp} from '../utils'

export class DeltaSubscriber extends Subscriber {
  constructor (destination) {
    super(destination)
    this._lastValue = null
    this._lastTime = null
  }

  _next (value) {
    const {_lastTime: lastTime} = this
    const time = timeStamp(value)
    const deltaT = lastTime ? time - lastTime : 0
    let {deltaX, deltaY} = value

    this._lastValue = value
    this._lastTime = time

    super._next({deltaX, deltaY, deltaT})
  }

  _complete () {
    this._lastValue = null
    this._lastTime = null
    super._complete()
  }
}

export class DeltaOperator {
  call (subscriber, source) {
    return source._subscribe(new DeltaSubscriber(subscriber))
  }
}

export default DeltaOperator
