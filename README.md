# dcs-client

Client-side libraries for connecting your website or web app to the
[Docuss](https://github.com/sylque/docuss) plugin:

- `comToPlugin.js`: low-level library for web apps. Allows to establish a direct
  link with the Docuss plugin.
- `dcs-html-based.js`: intermediate-level library for static websites. Requires
  that you add specific HTML markup to each of the website page.
- `dcs-decorator.js`: high-level library for static websites. HTML markup is
  dynamically added based on rules contained in a JSON file.

This repository also hosts some of the Docuss demos.

## How to use comToPlugin.js

### With npm

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

### In the browser:

[under construction]

## How to use dcs-html-based.js

[under construction]

## How to use dcs-decorator.js

[under construction]

## Private corner

If you want to build this package, `rollup` must be installed as a global
package:

```
npm install --global rollup
```

Then build with:

```
rollup -c
```

You can launch a local server to test the libraries locally in browser mode:

```
npm run demoServer
```

## License

See [here](https://github.com/sylque/docuss#license).
