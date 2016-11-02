const returnTrue = () => true
const returnFalse = () => false

export class EmulatedEvent {
  static Interface = {
    type: null,
    target: null,
    currentTarget: null,
    eventPhase: null,
    bubbles: null,
    cancelable: null,
    timeStamp: event => event.timeStamp || Date.now(),
    defaultPrevented: null,
    isTrusted: null,
  }

  constructor (event, type) {
    const Interface = this.constructor.Interface

    for (const propName in Interface) {
      if (!Interface.hasOwnProperty(propName)) continue
      var normalize = Interface[propName]
      if (normalize) {
        this[propName] = normalize(event)
      } else {
        this[propName] = event[propName]
      }
    }

    this.isDefaultPrevented = event.defaultPrevented ? returnTrue : returnFalse
    this.isPropagationStopped = returnFalse

    this.type = type
    this.nativeEvent = event
  }

  preventDefault () {
    this.defaultPrevented = true
    if (this.nativeEvent.preventDefault) this.nativeEvent.preventDefault()
    this.isDefaultPrevented = returnTrue
  }

  stopPropagation () {
    if (this.nativeEvent.stopPropagation) this.nativeEvent.stopPropagation()
    this.isPropagationStopped = returnTrue
  }
}

export default EmulatedEvent
