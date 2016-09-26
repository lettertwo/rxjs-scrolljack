import Updater from './Updater'

export class UpdaterStack extends Updater {
  static create (...updaters) {
    return new UpdaterStack(updaters)
  }

  _init (updaters) {
    this.updaters = new Map()
    if (updaters && updaters.length) {
      this.add(...updaters)
    }
  }

  _clone (target) {
    target.startValue = this.startValue
    if (this.updaters.size) {
      for (const [k, v] of this.updaters.entries()) {
        target.updaters.set(k, v.clone())
      }
    }
    return target
  }

  slice (begin, end) {
    const stack = new this.constructor()
    stack.stopped = this.stopped
    stack.startValue = this.startValue
    if (this.updaters.size) {
      const entries = Array.from(this.updaters.entries()).slice(begin, end)
      for (const [k, v] of entries) {
        stack.updaters.set(k, v.clone())
      }
    }
    return stack
  }

  get size () { return this.updaters.size }

  getUpdaters () {
    if (!this._cache) {
      this._cache = Array.from(this.updaters.values())
    }
    return [...this._cache]
  }

  add (...updaters) {
    this._cache = null
    for (const updater of updaters) {
      if (!this.updaters.has(updater)) {
        const u = typeof updater === 'function' ? updater() : updater
        if (this.startValue) u.start(this.startValue)
        this.updaters.set(updater, u)
      }
    }
    // Return a conveniently bound remove method!
    return () => this.remove(...updaters)
  }

  remove (...updaters) {
    for (const updater of updaters) {
      if (this.updaters.has(updater)) {
        this._cache = null
        const updaterToRemove = this.updaters.get(updater)
        this.updaters.delete(updater)
        return updaterToRemove
      }
    }
    return null
  }

  push (...updaters) {
    this._cache = null
    this.add(...updaters)
  }

  pop () {
    if (this.updaters.size) {
      const updaterToRemove = this.getUpdaters().pop()
      this.remove(updaterToRemove)
      this._cache = null
      return updaterToRemove
    }
    return null
  }

  unshift (...updaters) {
    const entries = this.updaters.entries()
    this.updaters = new Map()
    this.push(...updaters)
    for (const [k, v] of entries) {
      this.updaters.set(k, v)
    }
  }

  shift () {
    if (this.updaters.size) {
      const updaterToRemove = this.getUpdaters().shift()
      this.remove(updaterToRemove)
      this._cache = null
      return updaterToRemove
    }
    return null
  }

  replace (...updaters) {
    this.clear()
    return this.add(...updaters)
  }

  clear () {
    this._cache = null
    this.updaters.clear()
  }

  _start (value) {
    this.startValue = value
    if (!this.updaters.size) return super._start(value)
    return this.getUpdaters().reduce(this._applyStart, value)
  }

  _stop (value) {
    this.startValue = null
    if (!this.updaters.size) return super._stop(value)
    return this.getUpdaters().reduce(this._applyStop, value)
  }

  _computeNext (value) {
    if (!this.updaters.size) return super._computeNext(value)
    return this.getUpdaters().reduce(this._applyComputeNext, value)
  }

  _catchFrame (value) {
    if (!this.updaters.size) return super._catchFrame(value)
    for (const updater of this.getUpdaters()) {
      updater.catchFrame(value)
    }
  }

  _updateFrame (value) {
    if (!this.updaters.size) return super._updateFrame(value)
    for (const updater of this.getUpdaters()) {
      updater.updateFrame(value)
    }
  }

  _shouldGenerateNext () {
    if (!this.updaters.size) return super._shouldGenerateNext()
    return this.getUpdaters().some(this._callShouldGenerateNext)
  }

  _applyStart = (value, updater) => updater.start(value)
  _applyStop = (value, updater) => updater.stop(value)
  _applyComputeNext = (value, updater) => updater.computeNext(value)
  _callShouldGenerateNext = updater => updater.shouldGenerateNext()
}

export default UpdaterStack
