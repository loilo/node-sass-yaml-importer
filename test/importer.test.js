/**
 * @import * as Sass from 'sass'
 */

import { describe, it, expect } from 'vitest'
import * as sass from 'sass'
import * as moduleImporter from '../src/importer.mjs'
import * as commonjsImporter from '../src/importer.cjs'

const EXPECTATION = 'body {\n  color: #c33;\n}'

for (const [{ yamlImporter, legacyYamlImporter }, mode] of [
  /** @type {const} */ ([moduleImporter, 'module']),
  /** @type {const} */ ([commonjsImporter, 'commonjs']),
]) {
  const compileMethods = [
    {
      type: 'legacy',
      /**
       * @param {string} file
       * @param {Partial<Sass.LegacyOptions<'sync'>>} options
       */
      compile: (file, options = {}) =>
        sass.renderSync({ file, ...options, importer: legacyYamlImporter }),
    },
    {
      type: 'modern',
      /**
       * @param {string} file
       * @param {Sass.Options<'sync'>} options
       */
      compile: (file, options = {}) =>
        sass.compile(file, { ...options, importers: [yamlImporter] }),
    },
  ]

  describe(`Package type: ${mode}`, function () {
    for (const { type, compile } of compileMethods) {
      describe(`Sass JavaScript API: ${type}`, function () {
        it('imports strings', function () {
          const result = compile('./test/fixtures/strings/style.scss')

          expect(result.css.toString()).toBe(EXPECTATION)
        })

        it('imports JSON files', function () {
          const result = compile('./test/fixtures/json/style.scss')

          expect(result.css.toString()).toBe(EXPECTATION)
        })

        it('imports lists', function () {
          const result = compile('./test/fixtures/lists/style.scss')

          expect(result.css.toString()).toBe(EXPECTATION)
        })

        it('imports maps', function () {
          const result = compile('./test/fixtures/maps/style.scss')

          expect(result.css.toString()).toBe(EXPECTATION)
        })

        it('imports maps with single-quoted keys', function () {
          const result = compile(
            './test/fixtures/maps/single-quoted-key/style.scss',
          )

          expect(result.css.toString()).toBe(EXPECTATION)
        })

        it('imports maps with double-quoted keys', function () {
          const result = compile(
            './test/fixtures/maps/double-quoted-key/style.scss',
          )

          expect(result.css.toString()).toBe(EXPECTATION)
        })

        it.skipIf(type === 'modern')(
          'finds imports via includePaths',
          function () {
            const result = compile('./test/fixtures/include-paths/style.scss', {
              includePaths: ['./test/fixtures/include-paths/variables'],
            })

            expect(result.css.toString()).toBe(EXPECTATION)
          },
        )

        it.skipIf(type === 'modern')(
          'finds imports via multiple includePaths',
          function () {
            const result = compile('./test/fixtures/include-paths/style.scss', {
              includePaths: [
                './test/fixtures/include-paths/variables',
                './some/other/path/',
              ],
              importer: legacyYamlImporter,
            })

            expect(result.css.toString()).toBe(EXPECTATION)
          },
        )

        describe('errors', function () {
          it("throws when an import doesn't exist", function () {
            function render() {
              compile('./test/fixtures/errors/not-found/style.scss')
            }

            expect(render).toThrow("Can't find stylesheet to import.")
          })

          it('throws when imported data cannot be parsed as YAML', function () {
            function render() {
              compile('./test/fixtures/errors/data-parsing-failed/style.scss')
            }

            expect(render).toThrowError(/Failed to parse YAML data/)
          })

          it('throws when imported data ist not an object', function () {
            function render() {
              compile('./test/fixtures/errors/invalid-data/style.scss')
            }

            expect(render).toThrowError(/Data is not an object/)
          })
        })

        it('ignores non-YAML imports', function () {
          const result = compile('./test/fixtures/non-yaml/style.scss')

          expect(result.css.toString()).toBe(EXPECTATION)
        })

        describe('@use', function () {
          it('can utilise @use', function () {
            const result = compile('./test/fixtures/use/namespaced/style.scss')

            expect(result.css.toString()).toBe(EXPECTATION)
          })

          it('can utilise @use with an alias', function () {
            const result = compile('./test/fixtures/use/aliased/style.scss')

            expect(result.css.toString()).toBe(EXPECTATION)
          })

          it('can utilise @use without namespace', function () {
            const result = compile('./test/fixtures/use/unwrapped/style.scss')

            expect(result.css.toString()).toBe(EXPECTATION)
          })

          it('can utilise @use with @forward', function () {
            const result = compile('./test/fixtures/use/forwarded/style.scss')

            expect(result.css.toString()).toBe(EXPECTATION)
          })
        })

        it('automatically quotes strings where appropriate', function () {
          const result = compile('./test/fixtures/quoting/style.scss')

          expect(result.css.toString()).toBe(`body {
  color: red;
  color: #f00;
  color: "red";
  color: "really red";
}`)
        })
      })
    }
  })
}
