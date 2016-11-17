import $$observable from 'symbol-observable'
import {Subscriber} from 'rxjs/Subscriber'
import {DeltaGeneratorObservable} from '../observables/DeltaGeneratorObservable'
import {Updater} from '../updaters/Updater'
import {hasDelta, isDeltaLike} from '../utils'

export class KinematicOperator {
  constructor (optsOrLatestSource, latestSourceOrScheduler, scheduler) {
    let opts = optsOrLatestSource
    let latestSource = latestSourceOrScheduler
    let initialValue

    if (opts && typeof opts.schedule === 'function') {
      scheduler = opts
      opts = null
      latestSource = null
    } else if (opts && typeof opts[$$observable] === 'function') {
      scheduler = latestSource
      latestSource = opts
      opts = null
    } else if (isDeltaLike(opts)) {
      scheduler = latestSource
      initialValue = opts
      latestSource = null
      opts = null
    } else if (isDeltaLike(latestSource)) {
      initialValue = latestSource
      latestSource = null
    } else if (latestSource && typeof latestSource.schedule === 'function') {
      scheduler = latestSource
      latestSource = null
    }

    this.opts = opts
    this.latestSource = latestSource
    this.initialValue = initialValue
    this.scheduler = scheduler
  }

  _getUpdater () {
    return new Updater()
  }

  call (subscriber, source) {
    const {opts, latestSource, initialValue, scheduler} = this
    const updater = this._getUpdater(opts)
    return source._subscribe(new KinematicSubscriber(
      subscriber,
      updater,
      initialValue,
      latestSource,
      scheduler,
    ))
  }
}

export default KinematicOperator

export class KinematicSubscriber extends Subscriber {
  constructor (destination, updater, initialValue, latestSource, scheduler) {
    super(destination)
    this.scheduler = scheduler
    this.updater = updater
    this.latestSource = latestSource

    if (latestSource) {
      this.add(latestSource.subscribe(value => this._updateFrame(value)))
    }

    if (initialValue) {
      this._updateFrame(initialValue)
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
    if (!this.updater.stopped) {
      this.updater.stop()
    }
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
    const {destination: subscriber, updater, scheduler, latestSource} = this

    this._stop()

    this.add(DeltaGeneratorObservable
      .from(updater, scheduler, latestSource)
      .subscribe({
        next: value => { subscriber.next(value) },
        complete: () => { super._complete() },
      })
    )
  }
}
