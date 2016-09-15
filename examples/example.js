import Rx from 'rxjs'
import {ScrollBehavior, Wheel, Mouse, Touch, combineDeltas, momentum} from 'rxjs-scrolljack'

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
 * Create an Observable class that combines values
 * from the specified Observable classes.
 */
const Delta = combineDeltas(Wheel, Mouse, Touch)

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
  .startWith(0)

/**
 * Get the scrollable area of the content within its container
 * as the shape `{width, height}`.
 *
 * @param {HTMLElement} content - The scrollable content.
 * @param {HTMLElement} container - The scroll container.
 * @returns {Object<Bounds>} - The scrollable area.
 */
const getScrollBounds = (content, container) => ({
  width: Math.max(0, content.scrollWidth - container.offsetWidth),
  height: Math.max(0, content.scrollHeight - container.offsetHeight),
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
      <div id="border" style="width: 100vw; height: 75vh; border: 3px solid gray;">
        <div id="container" tabindex=1 style="position: relative; overflow: hidden; width: 100%; height: 100%;">
          <div id="content" style="will-change: transform;">
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
            "/>
          </div>
        </div>
      </div>
    </div>
  `)

  // The x offset input field.
  const inputX = document.getElementById('inputX')
  // The y offset input field.
  const inputY = document.getElementById('inputY')
  // The border around the scroll pane.
  const border = document.getElementById('border')
  // The container for the scroll content.
  const container = document.getElementById('container')
  // The scrollable content. This is the stuff that moves.
  const content = document.getElementById('content')

  /**
   * Render changes to the view in response to scrolling and offset changes.
   *
   * @param {boolean} scrolling - Whether or no scroll input has started.
   * @param {Offset} offset - The scroll offset.
   */
  const render = (scrolling, offset) => {
    inputX.value = offset.x  // update the x offset input field.
    inputY.value = offset.y  // update the y offset input field.
    content.style.transform = buildTransformString(offset)  // Move the content.
    content.style.pointerEvents = scrolling ? 'none' : null  // Disable pointer events on content while scrolling.
    border.style.borderColor = scrolling ? 'lime' : 'gray'  // Green means scrolling, gray means restoring.
  }

  /**
   * The valid scroll area as the shape `{width, height}`.
   * @type {Observable<Bounds>}
   */
  const bounds = Rx.Observable
    .fromEvent(window, 'resize')
    .map(() => getScrollBounds(content, container))
    .startWith(getScrollBounds(content, container))

  /**
   * The stream of clicks, which are mapped to scroll movements.
   * @type {Observable<Offset>}
   */
  const clicks = Rx.Observable
    .fromEvent(content, 'click')
    .map(e => ({
      x: e.clientX,
      y: e.clientY,
    }))

  /**
   * Create a Subject for our scroll offset updates.
   * We use a Subject so that it can both receive updates
   * from scroll behavior (`next()`) as well as
   * dispatch updates to our inputs (`subscribe()`).
   * @type {Subject<Offset>}
   */
  const updateOffset = new Rx.Subject()

  /**
   * Keep track of the last scroll offset.
   * We merge this with input values and apply
   * the generated offsets to the scroll behavior.
   * @type {Observable<Offset>}
   */
  const lastOffset = updateOffset.multicast(new Rx.BehaviorSubject())

  // Persist the last offset between subscriptions.
  lastOffset.connect()
  // Seed updates with an initial offset.
  updateOffset.next({x: 0, y: 0})

  /**
   * Merge input values with the last offset into the shape `{x, y}`.
   * This is a combination of values from the input fields,
   * plus the last offset from the scroll behavior.
   * @type {Observable<Offset>}
   */
  let input = Rx.Observable.merge(
    valueFromInput(inputX).withLatestFrom(lastOffset, (x, v) => ({...v, x})),
    valueFromInput(inputY).withLatestFrom(lastOffset, (y, v) => ({...v, y})),
  )

  /**
   * The scroll offset as the shape `{x, y}`.
   * This is a combination of values from the input fields,
   * plus the last offset from the scroll behavior.
   * @type {Observable<Offset>}
   */
  const offset = bounds.switchMap(bounds => {
    // We create a new ScrollBehavior whenever the bounds change.
    const scrollBehavior = new ScrollBehavior(container, Delta, bounds)

    const textInputs = lastOffset
      .take(1)  // Start with the last offset.
      .concat(input) // Concatenate input.

    // Generate animated movement whenever a click occurs.
    const clickInputs = clicks.switchMap(offset => lastOffset
      .take(1) // Start with the last offset.
      .mergeMap(v => scrollBehavior.startWith(v).moveTo(offset))
    )

    const inputs = Rx.Observable.merge(textInputs, clickInputs)
      .do(scrollBehavior)  // Update scrollBehavior with input.

    const outputs = scrollBehavior
      .momentum()  // Perform a decceleration at the end of a scroll behavior.
      .skip(1)  // Skip the first update because it's the last offset!
      .do(updateOffset)  // Update offset with scrollBehavior output.

    return Rx.Observable.combineLatest(inputs, outputs, (i, o) => o)
  })

  /**
   * Whether or not scroll input has started.
   * @type {Observable<boolean>}
   */
  const scrolling = Rx.Observable
    .merge(
      Delta.start(container).mapTo(true),
      Delta.stop(container).mapTo(false),
    )
    .startWith(false)

  // Combine the scrolling state with the scroll offset to render the view.
  return Rx.Observable
    .combineLatest(scrolling, offset)
    .subscribe(latest => render(...latest))
}

// Bootstrap the scroll view!
main()
