export const timeStamp = e => e.timeStamp ? parseInt(e.timeStamp, 10) : Date.now()

export const getRoot = () => (
  typeof window === 'undefined'
    ? typeof document === 'undefined'
      ? global : document : window
)

export const createWheelEventFrom = (value, type) => {
  const event = new WheelEvent(type, value)
  return event
}

export const inside = (w, h, dx, dy) => w * h > dx ** 2 + dy ** 2
export const outside = (w, h, dx, dy) => w * h < dx ** 2 + dy ** 2
