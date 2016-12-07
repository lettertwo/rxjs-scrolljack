import Rx from 'rxjs'
import Scrolljack from 'rxjs-scrolljack'

/**
 * @typedef Delta
 * @type {Object}
 * @property {Number} deltaX
 * @property {Number} deltaY
 * @property {Number} deltaT
 * @property {Number} velocityX
 * @property {Number} velocityY
 */

/**
 * @typedef Offset
 * @type {Object}
 * @property {Number} x
 * @property {Number} y
 */

/**
 * @typedef Bounds
 * @type {Object}
 * @property {Number} width
 * @property {Number} height
 */

/**
 * Parse an integer from a value.
 *
 * @param {string|number} v - The value to parse an integer from.
 * @returns {number} - The parsed integer.
 */
const int = v => parseInt(v, 10)

/**
 * Given an offset, returns a transform string
 * for translating an element by the amount offset.
 *
 * @param {Offset} offset - The offset to build a transform string from.
 * @returns {string} - The transform string.
 */
const buildTransformString = ({x, y}) => `translateX(${-int(x)}px) translateY(${-int(y)}px)`

/**
 * Parses an integer value from an input change event.
 *
 * @param {Event} e - The input change event.
 * @returns {number} - The changed input's value as a number.
 */
const parseChangeValue = e => parseInt(e.currentTarget.value, 10)

/**
 * Create an observable of values from a text input.
 *
 * @param {HTMLInputElement} input - A text input, i.e, `<input type="text" />`.
 * @returns {Observable<Number>} - The value from the text input as a number.
 */
const valueFromInput = input => Rx.Observable
  .fromEvent(input, 'change')
  .map(parseChangeValue)

/**
 * Get the scrollable area of the content.
 * as the shape `{width, height}`.
 *
 * @param {HTMLElement} content - The scrollable content.
 * @returns {Object<Bounds>} - The scrollable area.
 */
const getScrollBounds = content => ({
  width: content.scrollWidth,
  height: content.scrollHeight,
})

/**
 * Compute the next offset from the previous one plus a delta.
 *
 * @param {Offset} lastOffset - The last offset.
 * @param {Delta} delta - The delta to apply.
 * @returns {Offset} - The new offset.
 */
const computeNextOffset = (lastOffset, delta) => ({
  x: lastOffset.x + delta.deltaX,
  y: lastOffset.y + delta.deltaY,
})

/**
 * Round a scroll offset to 'snap' it to the nearest pixel.
 *
 * @param {Offset} offset - The offset to round.
 * @returns {Offset} - The rounded offset.
 */
const roundOffset = offset => ({
  x: Math.round(offset.x),
  y: Math.round(offset.y),
})

/**
 * Render our example scroll view.
 *
 * @returns {Subscription} - The subscription to scroll behavior.
 */
function main () {
  // The root node. We'll draw our scroll pane into this node.
  const root = document.getElementById('root')
  // Draw!
  root.insertAdjacentHTML('afterbegin', `
    <div>
      <h1 style="margin: 1em">
        <input type="number" id="inputX" style="width: 4em; font: inherit;" />,
        <input type="number" id="inputY" style="width: 4em; font: inherit;" />
      </h1>
      <div style="position: relative; width: 100vw; height: 75vh; border: 3px solid gray; overflow: hidden;">
        <div id="target" style="width: 100%; height: 100%; overflow: scroll;">
          <div id="content" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; will-change: transform; pointer-events: none;">
            <div style="
              width: 200vw;
              height: 200vw;
              border-top: 2vw solid gray;
              border-right: 2vw solid pink;
              border-bottom: 2vw solid pink;
              border-left: 2vw solid gray;
              background:
                linear-gradient(to right, pink, transparent, gray),
                linear-gradient(to bottom, pink, transparent, gray),
                repeating-linear-gradient(to right, transparent, transparent 10vw, gray 10vw, gray 20vw),
                repeating-linear-gradient(to bottom, pink, pink 10vw, transparent 10vw, transparent 20vw);
            ">
            </div>
          </div>
          <div id="rect" style="position: relative; z-index: -1;">&nbsp;</div>
        </div>
      </div>
    </div>
  `)

  // The x offset input field.
  const inputX = document.getElementById('inputX')
  // The y offset input field.
  const inputY = document.getElementById('inputY')
  // The scrollable target. This is the source of the native scroll events.
  const target = document.getElementById('target')
  // The scrollable content. This is the stuff that moves.
  const content = document.getElementById('content')
  // The actual scrollable rect. This is hidden behind the content.
  const rect = document.getElementById('rect')

  // Whether or not to ignore the next scroll event.
  let ignoreNextScrollEvent = false

  // A scroll event to ignore.
  let ignoredEvent

  target.addEventListener('scroll', event => {
    const ignore = ignoreNextScrollEvent
    if (ignore) {
      ignoredEvent = event
      ignoreNextScrollEvent = false
    }
  })

  const filterIgnoredEvents = event => {
    const {event: {nativeEvent = event} = event} = event
    return ignoredEvent !== nativeEvent
  }

  /**
   * Render changes to the view in response to scrolling and offset changes.
   *
   * @param {boolean} scrolling - Whether or no scroll input has started.
   * @param {Offset} offset - The scroll offset.
   */
  const render = (bounds, scrolling, offset) => {
    // Update the target scrollable area.
    rect.style.width = `${bounds.width}px`
    rect.style.height = `${bounds.height}px`

    if (target.scrollLeft !== offset.x) {
      ignoreNextScrollEvent = ignoreNextScrollEvent || scrolling
      target.scrollLeft = offset.x  // Update the scroll target left position.
    }

    if (target.scrollTop !== offset.y) {
      ignoreNextScrollEvent = ignoreNextScrollEvent || scrolling
      target.scrollTop = offset.y  // Update the scroll target top position.
    }

    inputX.value = offset.x  // update the x offset input field.
    inputY.value = offset.y  // update the y offset input field.
    content.style.transform = buildTransformString(offset)  // Move the content.
    target.style.borderColor = scrolling ? 'lime' : 'gray'  // Green means scrolling, gray means restoring.
  }

  /**
   * Keep track of the last scroll delta.
   * We merge this with input deltas and apply
   * the generated deltas to the scroll behavior.
   * @type {Observable<Offset>}
   */
  const lastDelta = new Rx.BehaviorSubject()

  // Seed updates with an initial delta.
  lastDelta.next(Scrolljack.createValue())

  /**
   * Keep track of the last scroll offset.
   * We merge this with input values and apply
   * the generated offsets to the scroll behavior.
   * @type {Observable<Offset>}
   */
  const lastOffset = new Rx.BehaviorSubject()

  // Seed updates with an initial offset.
  lastOffset.next({x: 0, y: 0})

  const shouldCloseScrollStart = (value, DeltaClass) => {
    if (filterIgnoredEvents(value)) return stopDeltas
    else return Rx.Observable.of(value)
  }

  /**
   * An observable of start deltas.
   * These represent the start of scroll input.
   * @type {Observable<Delta>}
   */
  // const startDeltas = Scrolljack.scrollStart(target)
  const startDeltas = Scrolljack.scrollStart(target, shouldCloseScrollStart)
  .filter(filterIgnoredEvents)  // filter out start events we should ignore.
  .share()

  /**
   * An observable of stop deltas.
   * These represent the stop of scroll input.
   * @type {Observable<Delta>}
   */
  const stopDeltas = Scrolljack.scrollStop(target, startDeltas).share()

  /**
   * Merge input values with the last offset into delta shapes.
   * This is a combination of values from the input fields,
   * plus the last offset from the scroll behavior.
   * @type {Observable<Delta>}
   */
  const textDeltas = Rx.Observable.merge(
    valueFromInput(inputX).withLatestFrom(lastOffset, (newX, {x: oldX}) =>
      Scrolljack.createValue({deltaX: newX - oldX})
    ),
    valueFromInput(inputY).withLatestFrom(lastOffset, (newY, {y: oldY}) =>
      Scrolljack.createValue({deltaY: newY - oldY})
    ),
  )

  /**
   * The stream of clicks, which are mapped to scroll movements.
   * @type {Observable<Delta>}
   */
  const clickDeltas = Rx.Observable
    .fromEvent(content, 'click')
    .do(v => console.log('click', v))
    .switchMap(event => lastOffset
      .take(1) // Take the last offset.
      .mergeMap(offset => Scrolljack
        .scrollTo({  // Emulate scrolling to the click's offset.
          deltaX: event.clientX - offset.x,
          deltaY: event.clientY - offset.y,
        })
        .do(() => (ignoreNextScrollEvent = true))  // Ignore scroll events that result from autoscrolling.
        .takeUntil(startDeltas.do(v => console.log('knock it off', v)))  // Cancel if actual scrolling occurs.
      )
    )

  /**
   * Merge click and text delta streams together, as these represent the
   * possible delta sources that are not coming from scroll input.
   * @type {Observable<Delta>}
   */
  const moveToDeltas = Rx.Observable.merge(clickDeltas, textDeltas)

  /**
   * An observable of move deltas.
   * These represent discrete events of scroll input.
   * @type {Observable<Delta>}
   */
  const moveDeltas = Scrolljack
    .scrollWindow(target, startDeltas, () => stopDeltas) // Create a window of scroll events for every start event, closing when a stop event occurs.
    .switchMap(move => move
      .filter(filterIgnoredEvents) // Filter out scroll events that we should ignore.
      .momentum(lastDelta)  // Apply decceleration to the end of the movement, taking into account the last delta.
      .takeUntil(moveToDeltas)  // Stop taking events and momentum when other input occurs.
    )

  /**
   * The valid scroll area as the shape `{width, height}`.
   * @type {Observable<Bounds>}
   */
  const scrollBounds = Rx.Observable
    .fromEvent(window, 'resize')
    .map(() => getScrollBounds(content))
    .startWith(getScrollBounds(content))

  /**
   * The scroll offsets as the shape `{x, y}`.
   * This is a combination of values from the input fields,
   * plus the last offset from the scroll behavior.
   * @type {Observable<Offset>}
   */
  const offsets = scrollBounds.switchMap(bounds =>
    lastOffset.take(1).mergeMap(initialOffset => Scrolljack
      .merge(moveDeltas, moveToDeltas)  // Get deltas from any of our inputs.
      .do(lastDelta)  // Keep track of the last delta.
      .scan(computeNextOffset, initialOffset)  // Accumulate deltas and convert to offsets.
      .do(lastOffset)  // Keep track of the last offset.
      .map(roundOffset)  // 'Snap' the offset to the nearest pixel.
    )
  )

  /**
   * Whether or not scroll input has started.
   * @type {Observable<boolean>}
   */
  const scrolling = Rx.Observable
    .merge(startDeltas.mapTo(true), stopDeltas.mapTo(false))
    .startWith(false)

  // Combine the scrolling state with the scroll offset to render the view.
  return Rx.Observable
    .combineLatest(scrollBounds, scrolling, lastOffset.take(1).concat(offsets))
    .subscribe(latest => render(...latest))
}

// Bootstrap the scroll view!
main()
