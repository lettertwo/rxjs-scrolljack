import {Updater} from './Updater'

class ComposedUpdater extends Updater {
  _init (updaters) {
    this.updaters = updaters.map(updater =>
      typeof updater === 'function' ? updater() : updater
    )
  }

  _start (value) {
    return this.updaters.reduce(this._applyStart, value)
  }

  _stop (value) {
    return this.updaters.reduce(this._applyStop, value)
  }

  _computeNext = value => {
    return this.updaters.reduce(this._applyComputeNext, value)
  }

  _catchFrame (value) {
    for (const updater of this.updaters) {
      updater.catchFrame(value)
    }
  }

  _updateFrame (value) {
    for (const updater of this.updaters) {
      updater.updateFrame(value)
    }
  }

  _shouldGenerateNext () {
    return this.updaters.some(this._callShouldGenerateNext)
  }

  _applyStart = (value, updater) => updater.start(value)
  _applyStop = (value, updater) => updater.stop(value)
  _applyComputeNext = (value, updater) => updater.computeNext(value)
  _callShouldGenerateNext = updater => updater.shouldGenerateNext()
}

export const composeUpdaters = (...updaters) => new ComposedUpdater(updaters)

export default composeUpdaters
