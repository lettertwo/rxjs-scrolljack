import {animationFrame} from 'rxjs/scheduler/animationFrame'
import {Observable} from 'rxjs/Observable'
import {parseOptsArray} from './parseOpts'
import {KinematicSubscriber} from './KinematicSubscriber'

export class Kinematic extends Observable {
  constructor (springs, source, startSource, stopSource, scheduler = animationFrame) {
    super()
    this.source = source
    this.startSource = startSource
    this.stopSource = stopSource
    this.scheduler = scheduler

    springs = parseOptsArray(springs)

    this.updater = this.constructor.createUpdater(springs)
  }

  static createUpdater () {
    throw new Error('Kinematic is a base class, and should not be used directly.')
  }

  subscribe (subscriber) {
    return this.source.subscribe(
      new KinematicSubscriber(
        subscriber,
        this.startSource,
        this.stopSource,
        this.updater,
        this.scheduler,
      )
    )
  }
}

export default Kinematic
