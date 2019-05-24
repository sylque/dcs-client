/**
 * A Route is defined by a layout and a Discourse url.
 * The Discourse url is computed either from (pageName, interactMode, 
 * triggerId) or from (pathname)
 * @typedef {Object} Route
 * @property {(0|1|2|3)} layout
 * @property {String} [pageName] - Only if layout=1|2|3
 * @property {('COMMENT'|'DISCUSS')} [interactMode] - Only if layout=2|3
 * @property {String} [triggerId] - Only if layout=2|3
 * @property {String} [pathname] - Only if layout=1
 */

/**
 * @typedef {Object} Counts
 * @property {[Object]} counts
 */

/**
 * @typedef {Object} RoutePushedParams
 * @property {Route} route
 * @property {String} descr
 * @property {Object} counts
 * @property {*} clientContext
 * @property {String} origin
 */

/**
 * @typedef {Object} SetRouteParams
 * @property {Route} route
 * @property {('PUSH'|'REPLACE')} mode
 * @property {*} clientContext
 */

/**
 * @typedef {Object} SetHashParams
 * @property {String} hash
 * @property {('PUSH'|'REPLACE')} mode
 */

/**
 * @typedef  {Object} RouteProps
 * @property {String} [category]
 * @property {String} [discourseTitle]
 * @property {String} [error]
 */

/**
 * @typedef {Object} Redirect
 * @property {Route} src
 * @property {Route} dest
 */

/**
 * @callback OnConnectedCallback
 */

/**
 * @callback OnTimeoutCallback
 */
