import {anchor} from '../updaters/anchor'
import {KinematicOperator} from './KinematicOperator'

export class AnchorOperator extends KinematicOperator {
  _getUpdater (opts) {
    return anchor(opts)
  }
}

export default AnchorOperator
