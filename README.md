# dcs-client

[Docuss](https://github.com/sylque/docuss) client-side libraries are used to
connect your website or web app to the Docuss plugin.

Depending on your use case, you'll need **one** of these 3 libraries, :

- `comToPlugin.js`: low-level library for web apps. It allows to establish a
  direct communication link with the Docuss plugin. See the documentation
  [here](comToPlugin.md).
- `dcs-html-based.js`: intermediate-level library for static websites. It
  requires that you add specific HTML markup to each of page of the website. See
  the documentation [here](dcs-html-based.md).
- `dcs-decorator.js`: high-level library for static websites. The specific HTML
  markup is automatically and dynamically added to your web pages based on rules
  contained in a description file. See the documentation
  [here](dcs-decorator.md).

**If you are new to Docuss**, the easiest way is to use the
[dcs-decorator](dcs-decorator.md) library.

## License

See [here](https://github.com/sylque/docuss#license).
