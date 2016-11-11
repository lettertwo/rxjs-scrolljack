import {momentum} from '../updaters/momentum'
import {KinematicOperator} from './KinematicOperator'

export class MomentumOperator extends KinematicOperator {
  _getUpdater (opts) {
    return momentum(opts)
  }
}

export default MomentumOperator
