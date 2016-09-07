export const preventDefault = e => e.preventDefault()

export const timeStamp = e => e.timeStamp ? parseInt(e.timeStamp, 10) : Date.now()

export const getRoot = () => (
  typeof window === 'undefined'
    ? typeof document === 'undefined'
      ? global : document : window
)
