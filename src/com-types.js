/**
 * @typedef {Object} Route
 * @property {String} layout - Can be FULL_CLIENT, FULL_DISCOURSE or WITH_SPLIT_BAR
 * @property {String} [pageName] - Only if layout=FULL_CLIENT or WITH_SPLIT_BAR
 * @property {String} [interactMode] - Only if layout=WITH_SPLIT_BAR
 * @property {String} [triggerId] - Only if layout=WITH_SPLIT_BAR
 * @property {Boolean} [showRight] - Only if layout=WITH_SPLIT_BAR
 * @property {String} [url]
 */

/**
 * @typedef {Object} Counts
 * @property {[Object]} counts
 */

/**
 * @typedef {Object} RouteAndDescrAndCountsAndContext
 * @property {Route} route
 * @property {String} descr - Only if layout=FULL_CLIENT or WITH_SPLIT_BAR
 * @property {[Object]} counts
 * @property {*} clientContext
 */

/**
 * @typedef {Object} RouteAndModeAndContext
 * @property {Route} route
 * @property {Boolean} mode
 * @property {*} clientContext
 */

/**
 * @typedef {Object} HashAndMode
 * @property {string} hash
 * @property {string} mode
 */

/**
 * @typedef  {Object} RouteProps
 * @property {String} [category] - Only if current route layout is WITH_SPLIT_BAR
 * @property {String} [discourseTitle] - Only if current route layout is WITH_SPLIT_BAR
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
