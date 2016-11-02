import $$observable from 'symbol-observable'
import {HijackableEventObservable} from '../observables/HijackableEventObservable'
import {filter} from 'rxjs/operator/filter'
import {share} from 'rxjs/operator/share'

const createEventSourceFactory = EmulatorClass => (target, eventType) => {
  let eventSource
  if (typeof target[$$observable] === 'function') {
    eventSource = target::filter(({type}) => type === eventType)
  } else {
    eventSource = HijackableEventObservable.create(target, eventType)
      .lift(new EmulatorClass())
  }
  return eventSource::share()
}

export const createEventSourcePool = EmulatorClass => {
  const eventSourceFactory = createEventSourceFactory(EmulatorClass)
  const eventTargets = new WeakMap()

  const getter = (target, eventType, realEventType = eventType) => {
    // If this target has no sources yet, create one now.
    if (!eventTargets.has(target)) {
      // Create a map of event types to sources for this target.
      const eventTypes = new Map()
      eventTargets.set(target, eventTypes)

      // Create a source for the 'real' event type.
      let eventSource = eventSourceFactory(target, realEventType)
      // Pool our 'real' event source.
      eventTypes.set(realEventType, eventSource)

      // If the 'real' event type is not the same as the event type we want,
      // create a source for the type we want (it will be the 'real' source)
      // filtered for the type we want.
      if (realEventType !== eventType) {
        eventSource = eventSourceFactory(eventSource, eventType)
        // Pool our event source.
        eventTypes.set(eventType, eventSource)
      }

      // Return the created event source.
      return eventSource
    } else {
      // Get the map of pooled event types for this target.
      const eventTypes = eventTargets.get(target)

      // If we have no source for this event type on this target, create one now.
      if (!eventTypes.has(eventType)) {
        let eventSource

        // If we had no 'real' event source on this target, create one now.
        if (!eventTypes.has(realEventType)) {
          eventSource = eventSourceFactory(target, realEventType)
          // Pool our 'real' event source.
          eventTypes.set(realEventType, eventSource)
        } else {
          // Get the 'real' event source.
          eventSource = eventTypes.get(realEventType)
        }

        // If the 'real' event type is not the same as the event type we want,
        // create a source for the type we want (it will be the 'real' source)
        // filtered for the type we want.
        if (realEventType !== eventType) {
          eventSource = eventSourceFactory(eventSource, eventType)
          // Pool our event source.
          eventTypes.set(eventType, eventSource)
        }

        // Return the created event source.
        return eventSource
      } else {
        // Return the pooled event source.
        return eventTypes.get(eventType)
      }
    }
  }

  getter.get = getter
  return getter
}

export default createEventSourcePool
