import $$observable from 'symbol-observable'
import {Subscriber} from 'rxjs/Subscriber'
import {DeltaGeneratorObservable} from '../observables/DeltaGeneratorObservable'
import {Updater} from '../updaters/Updater'
import {hasDelta} from '../utils'

export class KinematicOperator {
  constructor (optsOrLatestSource, latestSourceorScheduler, scheduler) {
    let opts = optsOrLatestSource
    let latestSource = latestSourceorScheduler

    if (opts && typeof opts.schedule === 'function') {
      scheduler = opts
      opts = null
      latestSource = null
    } else if (opts && typeof opts[$$observable] === 'function') {
      scheduler = latestSource
      latestSource = opts
      opts = null
    } else if (latestSource && typeof latestSource.schedule === 'function') {
      scheduler = latestSource
      latestSource = null
    }

    this.opts = opts
    this.latestSource = latestSource
    this.scheduler = scheduler
  }

  _getUpdater () {
    return new Updater()
  }

  call (subscriber, source) {
    const {opts, latestSource, scheduler} = this
    const updater = this._getUpdater(opts)
    return source._subscribe(new KinematicSubscriber(
      subscriber,
      updater,
      latestSource,
      scheduler,
    ))
  }
}

export default KinematicOperator

export class KinematicSubscriber extends Subscriber {
  constructor (destination, updater, latestSource, scheduler) {
    super(destination)
    this.scheduler = scheduler
    this.updater = updater
    this.latestSource = latestSource

    if (latestSource) {
      this.add(latestSource.subscribe(value => this._updateFrame(value)))
    }
  }

  _next (value) {
    this._start()
    value = this._computeNext(value)
    // Only update the frame value if we don't have a source for the latest value.
    if (!this.latestSource) this._updateFrame(value)
    super._next(value)
  }

  _start () {
    if (this.updater.stopped) {
      this.updater.start()
    }
  }

  _stop () {
    this.updater.stop()
  }

  _computeNext (value) {
    return this.updater.computeNext(value)
  }

  _updateFrame (value) {
    if (hasDelta(value)) {
      this.updater.updateFrame(value)
    }
  }

  _complete () {
    const {destination: subscriber, updater, scheduler} = this

    this._stop()

    this.add(DeltaGeneratorObservable
      .from(updater, scheduler)
      .subscribe({
        next: value => { subscriber.next(value) },
        complete: () => { super._complete() },
      })
    )
  }
}
