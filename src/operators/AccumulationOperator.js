import {Subscriber} from 'rxjs/Subscriber'

const add = (a, b) => parseFloat(a, 10) + parseFloat(b, 10)


export class AccumulationOperator {
  constructor (initialValue) {
    this.initialValue = initialValue
  }

  call (subscriber, source) {
    source._subscribe(new AccumulationSubscriber(subscriber, this.initialValue))
  }
}

export default AccumulationOperator

export class AccumulationSubscriber extends Subscriber {
  constructor (destination, initialValue) {
    super(destination)
    this._value = initialValue
  }

  _next (value) {
    let next = {...this._value}

    for (const key in value) {
      if (key in next) next[key] = add(next[key], value[key])
      else next[key] = value[key]
    }

    this._value = next
    return super._next(next)
  }

}
