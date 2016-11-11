import {rect} from '../updaters/rect'
import {KinematicOperator} from './KinematicOperator'

export class RectOperator extends KinematicOperator {
  _getUpdater (opts) {
    return rect(opts)
  }
}

export default RectOperator
