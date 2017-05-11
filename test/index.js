/* eslint-env mocha */
import yamlImporter, {
  isYAMLfile
}                   from '../src/index';
import sass         from 'node-sass';
import {expect}     from 'chai';
import {resolve}    from 'path';

const requiredImporter = require('../src/index');
const EXPECTATION = 'body {\n  color: #c33; }\n';

describe('Import type test', function() {
  it('imports strings', function() {
    let result = sass.renderSync({
      file: './test/fixtures/strings/style.scss',
      importer: yamlImporter
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('imports lists', function() {
    let result = sass.renderSync({
      file: './test/fixtures/lists/style.scss',
      importer: yamlImporter
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('imports maps', function() {
    let result = sass.renderSync({
      file: './test/fixtures/maps/style.scss',
      importer: yamlImporter
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('finds imports via includePaths', function() {
    let result = sass.renderSync({
      file: './test/fixtures/include-paths/style.scss',
      includePaths: ['./test/fixtures/include-paths/variables'],
      importer: yamlImporter
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it('finds imports via multiple includePaths', function() {
    let result = sass.renderSync({
      file: './test/fixtures/include-paths/style.scss',
      includePaths: ['./test/fixtures/include-paths/variables', './some/other/path/'],
      importer: yamlImporter
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  it(`throws when an import doesn't exist`, function() {
    function render() {
      sass.renderSync({
        file: './test/fixtures/include-paths/style.scss',
        includePaths: ['./test/fixtures/include-paths/foo'],
        importer: yamlImporter
      });
    }

    expect(render).to.throw(
      'Unable to find "variables.yml" from the following path(s): ' +
      `${resolve(process.cwd(), 'test/fixtures/include-paths')}, ${process.cwd()}, ./test/fixtures/include-paths/foo. ` +
      'Check includePaths.'
    );
  });

  it('ignores non-json imports', function() {
    let result = sass.renderSync({
      file: './test/fixtures/non-json/style.scss',
      importer: yamlImporter
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  // TODO: Added to verify named exports + CommonJS default export hack (see index.js).
  it('provides the default export when using node require to import', function() {
    let result = sass.renderSync({
      file: './test/fixtures/strings/style.scss',
      importer: requiredImporter
    });

    expect(result.css.toString()).to.eql(EXPECTATION);
  });

  // TODO: Added to verify named exports + CommonJS default export hack (see index.js).
  it('provides named exports of internal methods', function() {
    expect(isYAMLfile('import.yml')).to.be.true;
    expect(isYAMLfile('import.yaml')).to.be.true;
  });
});
