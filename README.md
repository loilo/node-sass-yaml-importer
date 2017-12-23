# node-sass-yaml-importer

[![Greenkeeper badge](https://badges.greenkeeper.io/Loilo/node-sass-yaml-importer.svg)](https://greenkeeper.io/)

YAML importer for [node-sass](https://github.com/sass/node-sass). Allows `@import`ing `.yml` files in Sass files parsed by `node-sass`.

This is a fork of the [node-sass-json-importer](https://github.com/Updater/node-sass-json-importer) repository, adjusted for usage with YAML.

[![npm](https://img.shields.io/npm/v/node-sass-yaml-importer.svg)](https://www.npmjs.com/package/node-sass-yaml-importer)
[![build status](https://travis-ci.org/Loilo/node-sass-yaml-importer.svg?branch=master)](https://travis-ci.org/Loilo/node-sass-yaml-importer)

## Usage
### [node-sass](https://github.com/sass/node-sass)
This module hooks into [node-sass's importer api](https://github.com/sass/node-sass#importer--v200---experimental).

```javascript
var sass = require('node-sass');
var yamlImporter = require('node-sass-yaml-importer');

// Example 1
sass.render({
  file: scss_filename,
  importer: yamlImporter,
  [, options..]
}, function(err, result) { /*...*/ });

// Example 2
var result = sass.renderSync({
  data: scss_content
  importer: [yamlImporter, someOtherImporter]
  [, options..]
});
```

### [node-sass](https://github.com/sass/node-sass) command-line interface

To run this using node-sass CLI, point `--importer` to your installed YAML importer, for example: 

```sh
./node_modules/.bin/node-sass --importer node_modules/node-sass-yaml-importer/dist/node-sass-yaml-importer.js --recursive ./src --output ./dist
```

### Webpack / [sass-loader](https://github.com/jtangelder/sass-loader)

#### Webpack v1

```javascript
import yamlImporter from 'node-sass-yaml-importer';

// Webpack config
export default {
  module: {
    loaders: [{
      test: /\.scss$/,
      loaders: ["style", "css", "sass"]
    }],
  },
  // Apply the YAML importer via sass-loader's options.
  sassLoader: {
    importer: yamlImporter
  }
};
```

#### Webpack v2

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

## Importing strings
Since YAML doesn't map directly to SASS's data types, a common source of confusion is how to handle strings. While [SASS allows strings to be both quoted and unqouted](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#sass-script-strings), strings containing spaces, commas and/or other special characters have to be wrapped in quotes. In terms of YAML, this means the string has to be double quoted:

##### Incorrect
```yaml
description: A sentence with spaces.
```

##### Also incorrect
```yaml
description: 'A sentence with spaces.'
```

##### Correct
```yaml
description: "'A sentence with spaces.'"
```

See discussion here for more:

https://github.com/Updater/node-sass-json-importer/pull/5

## Thanks to
This module is based on the [node-sass-json-importer](https://github.com/Updater/node-sass-json-importer) repository, they did all the work.
