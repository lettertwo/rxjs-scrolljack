/* global WheelEvent */

export const timeStamp = e => e.timeStamp ? parseInt(e.timeStamp, 10) : Date.now()

export const getRoot = () => (
  typeof window === 'undefined'
    ? typeof document === 'undefined'
      ? global : document : window
)

export const createWheelEventFrom = (value, type) => {
  if (supportsNewEvent()) {
    return new WheelEvent(type, value)
  } else {
    return createOldWheelEventFrom(value, type)
  }
}

const createOldWheelEventFrom = (value, type) => {
  const {view, detail, screenX, screenY, clientX, clientY, button, relatedTarget, deltaX, deltaY, deltaZ, deltaMode} = value
  const initArgs = [view, detail, screenX, screenY, clientX, clientY, button, relatedTarget, null, deltaX, deltaY, deltaZ, deltaMode]
  const event = document.createEvent('WheelEvent')
  event.initWheelEvent(type, true, true, ...initArgs)
  return event
}

let __supportsNewEvent = null

const supportsNewEvent = () => {
  if (__supportsNewEvent === null) {
    try {
      new WheelEvent('test')  // eslint-disable-line no-new
      __supportsNewEvent = true
    } catch (e) {
      __supportsNewEvent = false
    }
  }
  return __supportsNewEvent
}

export const inside = (w, h, dx, dy) => w * h > dx ** 2 + dy ** 2
export const outside = (w, h, dx, dy) => w * h < dx ** 2 + dy ** 2

export const hasDelta = value => Boolean(
  value && (value.deltaT || value.deltaX || value.deltaY)
)
