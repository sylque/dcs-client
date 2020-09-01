# dcs-client

[Docuss](https://github.com/sylque/docuss) client-side libraries are used to
connect your website or web app to the
[Docuss plugin](https://github.com/sylque/dcs-discourse-plugin).

**This project is not active anymore.** Fixes are provided to existing users, but I stopped working on new features. You might want to check  [DiscPage](https://github.com/sylque/discpage), which is somehow a simplified version of Docuss.

Depending on your use case, you'll need **one** of these 3 libraries, :

- `comToPlugin.js`: low-level library for communication with the Docuss plugin.
  Supports websites and web apps. See the documentation [here](comToPlugin.md).
- `dcs-html-based.js`: intermediate-level library for websites. It requires that
  you add specific HTML markup to each page of the website. See the
  documentation [here](dcs-html-based.md).
- `dcs-decorator.js`: high-level library for websites. The specific HTML markup
  mentioned above is dynamically added to web pages based on rules contained in
  a description file. See the documentation [here](dcs-decorator.md).

If you are new to Docuss, the easiest option is to use the dcs-decorator
library.

## License

See [here](https://github.com/sylque/docuss#license).
