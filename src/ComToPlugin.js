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

  //----------------------------------------------------------------------------
}

export const comToPlugin = new ComToPlugin()
