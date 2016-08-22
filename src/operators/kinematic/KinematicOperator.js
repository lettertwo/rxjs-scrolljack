import {animationFrame} from 'rxjs/scheduler/animationFrame'
import {parseOptsArray} from './parseOpts'

export class KinematicOperator {
  constructor (opts, startSource, stopSource, scheduler = animationFrame) {
    this.opts = parseOptsArray(opts)
    this.startSource = startSource
    this.stopSource = stopSource
    this.scheduler = scheduler
  }

  static createSubscriber () {
    throw new Error('KinematicOperator is a base class, and should not be used directly.')
  }

  call (subscriber, source) {
    return source._subscribe(this.constructor.createSubscriber(
      subscriber,
      this.opts,
      this.startSource,
      this.stopSource,
      this.scheduler,
    ))
  }
}

export default KinematicOperator
