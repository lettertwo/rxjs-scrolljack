export const scheduleNext = (state, next) => {
  let shouldSchedule = !state.subscription || !state.subscription.isUnsubscribed

  if (shouldSchedule) {
    state.time = state.time || state.scheduler.now()

    const subscription = state.scheduler.schedule(next, 0, state)
    if (!state.subscription) {
      state.subscription = subscription
    } else {
      state.subscription.add(subscription)
    }
    return state.subscription
  }
}

export const createShouldScheduleNext = predicate => ({opts}) => opts.some(predicate)
