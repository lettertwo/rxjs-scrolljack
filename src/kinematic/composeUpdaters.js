import {createIterator} from 'iterall'

class ComposedUpdater {
  constructor (updaters) {
    this.updaters = updaters.map(updater =>
      typeof updater === 'function' ? updater() : updater
    )
  }

  start (value) {
    return this.updaters.reduce(this.__applyStart, value)
  }

  stop (value) {
    return this.updaters.reduce(this.__applyStop, value)
  }

  computeNext = value => {
    return this.updaters.reduce(this.__applyComputeNext, value)
  }

  catchFrame (value) {
    for (const updater of this.updaters) {
      updater.catchFrame(value)
    }
  }

  updateFrame (value) {
    for (const updater of this.updaters) {
      updater.updateFrame(value)
    }
  }

  shouldGenerateNext () {
    return this.updaters.some(this.__callShouldGenerateNext)
  }

  generateNext = function * (lastValue, time) {
    let count = this.updaters.length

    // Map update generators to iterators.
    let updaters = this.updaters.map(updater =>
      createIterator(updater.generateNext(lastValue, time))
    )

    while (count) {
      for (let i = 0; i < count; i++) {
        const updater = updaters[i]
        let {value, done} = updater.next()
        if (!done) {
          lastValue = value
        } else {
          updaters.splice(i, 1)
          count--
        }
      }

      yield lastValue
    }
  }

  __applyStart = (value, updater) => updater.start(value)
  __applyStop = (value, updater) => updater.stop(value)
  __applyComputeNext = (value, updater) => updater.computeNext(value)
  __applyCatchFrame = (value, updater) => updater.catchFrame(value)
  __applyUpdateFrame = (value, updater) => updater.updateFrame(value)
  __callShouldGenerateNext = updater => updater.shouldGenerateNext()
}

export const composeUpdaters = (...updaters) => new ComposedUpdater(updaters)

export default composeUpdaters
