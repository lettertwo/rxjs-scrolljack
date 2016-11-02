import {Subscriber} from 'rxjs/Subscriber'
import {EmulatedMouseEvent} from '../events/EmulatedMouseEvent'

export class MouseEventEmulatorOperator {
  call (subscriber, source) {
    return source._subscribe(
      new MouseEventEmulatorSubcriber(subscriber)
    )
  }
}

export default MouseEventEmulatorOperator

class MouseEventEmulatorSubcriber extends Subscriber {
  _next (value) {
    super._next(new EmulatedMouseEvent(value))
  }
}
