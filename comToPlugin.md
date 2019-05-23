# comToPlugin.js

## Setup

Install with:

```
npm i dcs-client
```

## Initialization

```javascript
import { comToPlugin, inIFrame } from 'dcs-client'

if (inIFrame()) {
  comToPlugin.connect({
    discourseOrigin: '*',
    timeout: 10000,
    onTimeout: () => console.log('Could not connect to the Docuss plugin')
  })
}
```

## Set Discourse route

```javascript
/**
 * A Route is defined by a layout and a Discourse url.
 * The Discourse url is computed from (pageName, interactMode, triggerId) or
 * from (pathname)
 * @typedef {Object} Route
 * @property {(0|1|2|3)} layout
 * @property {String} [pageName] - Only if layout=1|2|3
 * @property {('COMMENT'|'DISCUSS')} [interactMode] - Only if layout=2|3
 * @property {String} [triggerId] - Only if layout=2|3
 * @property {String} [pathname] - Only if layout=1
 */
/**
 * @typedef {Object} SetRouteParams
 * @property {Route} route
 * @property {('PUSH'|'REPLACE')} mode
 * @property {*} clientContext
 */
/**
 * @param {SetRouteParams}
 */
comToPlugin.postSetDiscourseRoute({
  route: { layout: 1, pathname: a.pathname },
  mode: 'PUSH',
  clientContext: { foo: 'user-defined data here' }
})
```
Possible layouts:
![](layouts.png)

## Browser usage

[under construction]
