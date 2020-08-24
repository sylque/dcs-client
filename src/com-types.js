/**
 * A Route is defined by a layout and a Discourse url.
 * The Discourse url is computed either from (pageName, interactMode,
 * triggerId) or from (pathname)
 * @typedef {Object} Route
 * @property {(0|1|2|3)} layout
 * @property {String} [pageName] - Only if layout=0|2|3
 * @property {String} [hash]
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
 * @typedef  {Object} RouteProps
 * @property {String} [category] - The name of an existing Discourse category,
 * which will be set if the user creates a topic from the route
 * @property {String} [discourseTitle] - A text that will be displayed at the
 * top of the Discourse page
 * @property {String} [error] - An error message that will be displayed instead
 * of the website page.
 */

/**
 * @typedef {Object} Redirect
 * @property {Route} src
 * @property {Route} dest
 */

/**
 * @typedef  {Object} CreateTagsParams
 * @property {String} pageName
 * @property {[String]} [triggerIds]
 * @property {(1|2|3|4)} [notificationLevel=1] - 1=Regular, 2=Tracking,
 * 3=Watching, 4=Watching First Post. See:
 * https://github.com/discourse/discourse/blob/acd1693dac1bff6ff50250d942134bc48a27ff14/app/assets/javascripts/discourse/lib/notification-levels.js.es6#L1
 */

/**
 * @typedef  {Object} CreateTopicParams
 * @property {String} title - Topic title. Beware of Discourse title settings 
 * (length, entropy, similarity, etc.)
 * @property {String} body - Topic body. Beware of Discourse body settings 
 * (length, etc.)
 * @property {String} [category] - Name of the topic category
 * @property {String} pageName - Name of the Docuss page for which the topic 
 * needs to be created
 * @property {String} triggerId - Id of the trigger for which the topic needs 
 * to be created
 * @property {(1|2|3|4)} [tagNotificationLevel=1] - Notification level of the
 * tag "dcs-pageName-triggerId"
 * 1=Regular, 2=Tracking, 3=Watching, 4=Watching First Post. See:
 * https://github.com/discourse/discourse/blob/acd1693dac1bff6ff50250d942134bc48a27ff14/app/assets/javascripts/discourse/lib/notification-levels.js.es6#L1
 */

/**
 * @callback OnConnectedCallback
 */

/**
 * @callback OnTimeoutCallback
 */
