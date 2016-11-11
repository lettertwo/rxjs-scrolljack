export const timeStamp = e => e.timeStamp ? parseInt(e.timeStamp, 10) : Date.now()

export const getRoot = () => (
  typeof window === 'undefined'
    ? typeof document === 'undefined'
      ? global : document : window
)

export const inside = (w, h, dx, dy) => w * h > dx ** 2 + dy ** 2
export const outside = (w, h, dx, dy) => w * h < dx ** 2 + dy ** 2

export const hasDelta = value => Boolean(
  value && (value.deltaT || value.deltaX || value.deltaY)
)

export const isDeltaLike = value => Boolean(
  value && (value.deltaT != null || value.deltaX != null || value.deltaY != null)
)
