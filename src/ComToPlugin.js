import * as comTypes from './com-types'
import { Bellhop } from 'bellhop-iframe'
import { u } from './utils'

export const inIFrame = u.inIFrame

class ComToPlugin {
  //----------------------------------------------------------------------------

  constructor() {
    this._bellhop = new Bellhop()
    this._timer = null
    this._onConnected = null

    // This is called avery time the iframe reloads
    this._bellhop.on('connected', () => {
      if (this._timer) {
        clearTimeout(this._timer)
        this._timer = null
      }
      this._onConnected && this._onConnected()
    })
  }

  //----------------------------------------------------------------------------

  /**
   * @param {Object} arg
   * @param {string} arg.discourseOrigin
   * @param {OnConnectedCallback} arg.onConnected
   * @param {number} arg.timeout
   * @param {OnTimeoutCallback} arg.onTimeout
   */
  connect({ discourseOrigin, onConnected, timeout, onTimeout }) {
    if (!u.inIFrame()) {
      throw new Error('comToPlugin must be used in an iframe')
    }
    this.disconnect()
    this._onConnected = onConnected
    this._timer = timeout
      ? setTimeout(() => {
          onTimeout && onTimeout()
        }, timeout)
      : null
    this._bellhop.connect(undefined, discourseOrigin)
  }

  disconnect() {
    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = null
    }
    this._bellhop.disconnect()
  }

  isConnected() {
    return this._bellhop.connected
  }

  //----------------------------------------------------------------------------

  /**
   * @callback OnDiscourseRoutePushedCallback
   * @param {RoutePushedParams}
   */
  /**
   *  @param {OnDiscourseRoutePushedCallback} cb
   */
  onDiscourseRoutePushed(cb) {
    this._bellhop.on('m2', e => cb(e.data))
  }

  /**
   * @callback OnCountsChangedCallback
   * @param {Counts}
   */
  /**
   *  @param {OnCountsChangedCallback} cb
   */
  onCountsChanged(cb) {
    this._bellhop.on('m3', e => cb(e.data))
  }

  //----------------------------------------------------------------------------

  /**
   * @param {SetRouteParams}
   */
  postSetDiscourseRoute({ route, mode, clientContext }) {
    this._bellhop.send('m4', arguments[0])
  }

  /**
   * @param {RouteProps} props
   */
  postSetRouteProps({ category, discourseTitle, error }) {
    this._bellhop.send('m6', arguments[0])
  }

  /**
   * @param {[Redirect]} redirects
   */
  postSetRedirects(redirects) {
    this._bellhop.send('m7', redirects)
  }

  /**
   * @param {CreateTagsParams}
   */
  postCreateDcsTags({ pageName, triggerIds, notificationLevel }) {
    this._bellhop.send('m8', arguments[0])
  }

  //----------------------------------------------------------------------------
}

export const comToPlugin = new ComToPlugin()

//==============================================================================
// Better scrolling in iframe
//==============================================================================

/*
In an iframe, when user scrolls past the top/bottom of the page with the mouse 
wheel, the parent window scrolls instead. This isn't good in Discourse, where
the iframe is full height on the right.
So what we need to do os to intercept the wheel event and cancel it before it 
is forwarded to the parent window.
Notice that the "scroll" event fires *after* scrolling has been done, so it is 
useless in our case
*/

function handleScrollEvent(e, scrollDirection) {
  if (scrollDirection === 'UP') {
    if (window.scrollY === 0) {
      e.preventDefault()
    }
  } else if (scrollDirection === 'DOWN') {
    // Compute the maximum scroll Y value
    const scrollLimitY =
      Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      ) - window.innerHeight

    // However, for an unknown reason, in Firefox and Chrome, window.scrollY
    // never reaches the maximum value but is stuck to 544.567969 when
    // scrollLimitY is 545
    if (window.scrollY > scrollLimitY - 1) {
      e.preventDefault()
    }
  }
}

window.addEventListener(
  'wheel',
  e => {
    if (e.deltaY < 0) {
      handleScrollEvent(e, 'UP')
    } else if (e.deltaY > 0) {
      handleScrollEvent(e, 'DOWN')
    }
  },
  { passive: false } // Passive is true by default on all scroll-related events under Chrome and Firefox
)

document.addEventListener('keydown', e => {
  if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
    return
  }
  if (e.code === 'ArrowUp' || e.code === 'PageUp') {
    handleScrollEvent(e, 'UP')
  }
  if (e.code === 'ArrowDown' || e.code === 'PageDown') {
    handleScrollEvent(e, 'DOWN')
  }
})

//==============================================================================
