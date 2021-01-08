/* eslint-env jest */
const yamlImporter = require('../dist/node-sass-yaml-importer')
const { isValidDataFile } = yamlImporter
const sass = require('sass')
const { resolve } = require('path')

const EXPECTATION = 'body {\n  color: #c33;\n}'

describe('Import type test', function () {
  it('imports strings', function () {
    let result = sass.renderSync({
      file: './test/fixtures/strings/style.scss',
      importer: yamlImporter
    })

    expect(result.css.toString()).toBe(EXPECTATION)
  })

  it('imports JSON files', function () {
    let result = sass.renderSync({
      file: './test/fixtures/json/style.scss',
      importer: yamlImporter
    })

    expect(result.css.toString()).toBe(EXPECTATION)
  })

  it('imports lists', function () {
    let result = sass.renderSync({
      file: './test/fixtures/lists/style.scss',
      importer: yamlImporter
    })

    expect(result.css.toString()).toBe(EXPECTATION)
  })

  it('imports maps', function () {
    let result = sass.renderSync({
      file: './test/fixtures/maps/style.scss',
      importer: yamlImporter
    })

    expect(result.css.toString()).toBe(EXPECTATION)
  })

  it('finds imports via includePaths', function () {
    let result = sass.renderSync({
      file: './test/fixtures/include-paths/style.scss',
      includePaths: ['./test/fixtures/include-paths/variables'],
      importer: yamlImporter
    })

    expect(result.css.toString()).toBe(EXPECTATION)
  })

  it('finds imports via multiple includePaths', function () {
    let result = sass.renderSync({
      file: './test/fixtures/include-paths/style.scss',
      includePaths: [
        './test/fixtures/include-paths/variables',
        './some/other/path/'
      ],
      importer: yamlImporter
    })

    expect(result.css.toString()).toBe(EXPECTATION)
  })

  it(`throws when an import doesn't exist`, function () {
    function render() {
      sass.renderSync({
        file: './test/fixtures/include-paths/style.scss',
        includePaths: ['./test/fixtures/include-paths/foo'],
        importer: yamlImporter
      })
    }

    expect(render).toThrow(
      'Unable to find "variables.yml" from the following path(s): ' +
        `${resolve(
          process.cwd(),
          'test/fixtures/include-paths'
        )}, ${process.cwd()}, ./test/fixtures/include-paths/foo. ` +
        'Check includePaths.'
    )
  })

  it('ignores non-yaml imports', function () {
    let result = sass.renderSync({
      file: './test/fixtures/non-yaml/style.scss',
      importer: yamlImporter
    })

    expect(result.css.toString()).toBe(EXPECTATION)
  })

  // TODO: Added to verify named exports + CommonJS default export hack (see index.js).
  it('provides the default export when using node require to import', function () {
    let result = sass.renderSync({
      file: './test/fixtures/strings/style.scss',
      importer: yamlImporter
    })

    expect(result.css.toString()).toBe(EXPECTATION)
  })

  // TODO: Added to verify named exports + CommonJS default export hack (see index.js).
  it('provides named exports of internal methods', function () {
    expect(isValidDataFile('import.yml')).toBe(true)
    expect(isValidDataFile('import.yaml')).toBe(true)
  })
})
