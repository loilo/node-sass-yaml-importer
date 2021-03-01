# node-sass-yaml-importer

[![Tests](https://badgen.net/github/checks/loilo/node-sass-yaml-importer/master)](https://github.com/loilo/node-sass-yaml-importer/actions)
[![Version on npm](https://badgen.net/npm/v/node-sass-yaml-importer)](https://www.npmjs.com/package/node-sass-yaml-importer)

YAML importer for [sass](https://github.com/sass/sass) (originally for the now deprecated [node-sass](https://github.com/sass/node-sass), hence the package name).

This allows `@import`ing/`@use`ing `.yml` files (and `.json` files, since that's a subset of YAML) in Sass files parsed by `sass`.

This is a fork of the [node-sass-json-importer](https://github.com/Updater/node-sass-json-importer) repository, adjusted for usage with YAML.

## Setup

### [sass](https://github.com/sass/sass)

This module hooks into [sass' importer api](https://sass-lang.com/documentation/js-api#importer).

```javascript
const sass = require('sass');
const yamlImporter = require('node-sass-yaml-importer');

// Example 1
sass.render({
  file: scss_filename,
  importer: yamlImporter,
  // ...options
}, (err, result) => { /*...*/ });

// Example 2
const result = sass.renderSync({
  data: scss_content
  importer: [yamlImporter, someOtherImporter]
  // ...options
});
```

### Webpack / [sass-loader](https://github.com/jtangelder/sass-loader)

#### Webpack v1

```javascript
import yamlImporter from 'node-sass-yaml-importer'

// Webpack config
export default {
  module: {
    loaders: [
      {
        test: /\.scss$/,
        loaders: ['style', 'css', 'sass']
      }
    ]
  },
  // Apply the YAML importer via sass-loader's options.
  sassLoader: {
    importer: yamlImporter
  }
}
```

#### Webpack v2 and upwards

```javascript
import yamlImporter from 'node-sass-yaml-importer';

// Webpack config
export default {
  module: {
    rules: [
      test: /\.scss$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1
          },
        },
        {
          loader: 'sass-loader',
          // Apply the YAML importer via sass-loader's options.
          options: {
            importer: yamlImporter,
          },
        },
      ],
    ],
  },
};
```

## Usage

Given the following `colors.yml` file:
```yaml
primary: blue
secondary: red
```

The importer allows your Sass file in the same folder to do this:

```scss
@import 'colors.yml';

.some-class {
  background: $primary;
}
```

Note that [`@import` is somewhat deprecated](https://sass-lang.com/documentation/at-rules/import) and you should use `@use` instead:

```scss
@use 'colors.yml';

.some-class {
  // Data is automatically namespaced:
  background: colors.$primary;
}
```

To achieve the same behavior as with `@import`, you can [change the namespace to `*`](https://sass-lang.com/documentation/at-rules/use#choosing-a-namespace):

```scss
@use 'colors.yml' as *;

.some-class {
  // Colors are no longer namespaced:
  background: $primary;
}
```

### Importing strings

Since YAML doesn't map directly to SASS's data types, a common source of confusion is how to handle strings. While [SASS allows strings to be both quoted and unqouted](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#sass-script-strings), strings containing spaces, commas and/or other special characters have to be wrapped in quotes. In terms of YAML, this means the string has to be double quoted:

#### Incorrect

```yaml
description: A sentence with spaces.
```

#### Also incorrect

```yaml
description: 'A sentence with spaces.'
```

#### Correct

```yaml
description: "'A sentence with spaces.'"
```

See discussion here for more:

https://github.com/Updater/node-sass-json-importer/pull/5

### Importing objects

Since version 6 of this package, _all_ map keys are quoted:

```yaml
# colors.yml
colors:
  red: '#f00'
```

```scss
@use 'colors.yml' as *;

:root {
  // This no longer works:
  color: map-get($colors, red);

  // Do this instead:
  color: map-get($colors, 'red');
}
```

## Thanks to

This module is based on the [node-sass-json-importer](https://github.com/Updater/node-sass-json-importer) repository, they did all the work.
