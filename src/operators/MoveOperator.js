import {Subscriber} from 'rxjs/Subscriber'

export class MoveSubscriber extends Subscriber {
  constructor (destination, source, stopSource) {
    super(destination)
    this.source = source
    this.stopSource = stopSource
    this.started = false
  }

  _next (value) {
    if (!this.started) {
      this.started = true
      this.sourceSub = this.source._subscribe(this.dispatch)
      this.add(this.sourceSub)
      this.stopSub = this.stopSource._subscribe(this.stop)
      this.add(this.stopSub)
    }
  }

  _complete () {
    this.unsub()
    this.started = false
    super._complete()
  }

  unsub () {
    if (this.sourceSub) {
      this.remove(this.sourceSub)
      this.sourceSub.unsubscribe()
      this.sourceSub = null
    }
    if (this.stopSub) {
      this.remove(this.stopSub)
      this.stopSub.unsubscribe()
      this.stopSub = null
    }
  }

  dispatch = value => {
    this.destination.next(value)
  }

  stop = value => {
    this.started = false
    this.unsub()
  }
}

export class MoveOperator {
  constructor (startSource, stopSource) {
    this.startSource = startSource
    this.stopSource = stopSource
  }

  call (subscriber, source) {
    const {startSource, stopSource} = this
    return startSource._subscribe(
      new MoveSubscriber(subscriber, source, stopSource)
    )
  }
}
