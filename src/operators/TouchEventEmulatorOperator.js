import {Subscriber} from 'rxjs/Subscriber'
import {EmulatedTouchEvent} from '../events/EmulatedTouchEvent'

export class TouchEventEmulatorOperator {
  call (subscriber, source) {
    return source._subscribe(
      new TouchEventEmulatorSubcriber(subscriber)
    )
  }
}

export default TouchEventEmulatorOperator

class TouchEventEmulatorSubcriber extends Subscriber {
  _next (value) {
    super._next(new EmulatedTouchEvent(value))
  }
}
