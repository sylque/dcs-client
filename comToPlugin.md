# comToPlugin.js

## How to use it with npm

Install with:

```
npm i dcs-client
```

Use like this:

```javascript
import { comToPlugin, inIFrame } from 'dcs-client'

...

if (inIFrame()) {
  comToPlugin.connect({
    discourseOrigin: '*',
    timeout: 10000,
    onTimeout: () => console.log('Could not connect to the Docuss plugin')
  })
}
```

## How to use it in the browser

[under construction]
