/**
 * @import * as Sass from 'sass'
 */

const path = require('path')
const fs = require('fs')
const nodeUrl = require('url')
const yaml = require('js-yaml')

const { isPromiseLike, isPlainObject } = require('./util/helpers.cjs')
const { fsResolver, includedPathsResolver } = require('./util/resolvers.cjs')
const transformObjectToSassVariables = require('./util/js-to-scss.cjs')
const SassJsImporterDataParsingFailedError = require('./errors/SassJsImporterDataParsingFailedError.cjs')
const SassJsImporterInvalidDataError = require('./errors/SassJsImporterInvalidDataError.cjs')

/**
 * Check if the provided URL points to a YAML/JSON file
 *
 * @param {string} url
 * @returns {boolean}
 */
function isValidDataFile(url) {
  return /\.(ya?ml|json)$/.test(url)
}

/**
 * Create an importer for Sass' JavaScript API which imports YAML files as Sass variables
 *
 * @param {{
 *   resolve: (url: string, previous: string) => string|null|Promise<string|null>
 * }} options
 * @return {Sass.Importer}
 */
function createYamlImporter({ resolve }) {
  /**
   * @param {string|null} absoluteFilePath
   * @return {URL|null}
   */
  const makeUrl = absoluteFilePath => {
    if (absoluteFilePath === null) return null

    return nodeUrl.pathToFileURL(absoluteFilePath)
  }

  return {
    canonicalize(url, context) {
      if (!isValidDataFile(url)) return null
      if (context.containingUrl === null) return null

      const absoluteFilePath = resolve.call(
        this,
        url,
        nodeUrl.fileURLToPath(context.containingUrl),
      )
      if (isPromiseLike(absoluteFilePath)) {
        return absoluteFilePath.then(makeUrl)
      } else {
        return makeUrl(absoluteFilePath)
      }
    },
    load(url) {
      const absoluteFilePath = nodeUrl.fileURLToPath(url)

      const serializedData = fs.readFileSync(absoluteFilePath, 'utf8')

      /**
       * @type {unknown}
       */
      let data

      try {
        data = yaml.load(serializedData)
      } catch {
        throw new SassJsImporterDataParsingFailedError(
          `Failed to parse YAML data: ${serializedData}`,
        )
      }

      if (!isPlainObject(data)) {
        throw new SassJsImporterInvalidDataError('Data is not an object')
      }

      return {
        contents: transformObjectToSassVariables(data),
        syntax: 'scss',
      }
    },
  }
}

/**
 * A YAML importer for Sass' JavaScript API
 */
const yamlImporter = /** @type {Sass.Importer<'sync'>} */ (
  createYamlImporter({
    resolve: fsResolver,
  })
)

/**
 * Create a YAML importer with the given resolver
 *
 * @param {{
 *   resolve: (this: Sass.LegacyImporterThis, url: string, previous: string) => string|null|Promise<string|null>
 * }} options
 * @return {Sass.LegacyImporter}
 */
function createLegacyYamlImporter({ resolve }) {
  const jsImporter = createYamlImporter({ resolve })

  /**
   * @param {URL|null} canonicalUrl
   * @return {Sass.LegacyImporterResult}
   */
  const loadJs = canonicalUrl => {
    if (canonicalUrl === null) return null

    let result
    try {
      result = /** @type {Sass.ImporterResult | null} */ (
        jsImporter.load(canonicalUrl)
      )
    } catch (error) {
      return /** @type {Error} */ (error)
    }

    if (result === null) return null

    return { contents: result.contents }
  }

  /**
   * @overload
   * @this {Sass.LegacyImporterThis}
   * @param {string} requestUrl
   * @param {string} previousUrl
   * @param {(result: Sass.LegacyImporterResult) => void} done
   * @returns {void}
   */

  /**
   * @overload
   * @this {Sass.LegacyImporterThis}
   * @param {string} requestUrl
   * @param {string} previousUrl
   * @returns {Sass.LegacyImporterResult}
   */

  /**
   * @this {Sass.LegacyImporterThis}
   * @param {string} requestUrl
   * @param {string} previousUrl
   * @param {undefined|((result: Sass.LegacyImporterResult) => void)} done
   * @returns {void|Sass.LegacyImporterResult}
   */
  return function (requestUrl, previousUrl, done) {
    const containingUrl = nodeUrl.pathToFileURL(previousUrl)
    const context = /** @type {Sass.CanonicalizeContext} */ ({ containingUrl })
    const canonicalUrl = jsImporter.canonicalize.call(this, requestUrl, context)

    if (isPromiseLike(canonicalUrl)) {
      canonicalUrl
        .then(url => {
          done?.(loadJs(url))
        })
        .catch(error => {
          done?.(error)
        })
    } else {
      return loadJs(canonicalUrl)
    }
  }
}

/**
 * A JavaScript importer for Sass' legacy JavaScript API
 */
const legacyYamlImporter = /** @type {Sass.LegacySyncImporter} */ (
  createLegacyYamlImporter({
    resolve(url, prev) {
      const fsResult = fsResolver(url, prev)
      if (fsResult !== null) return fsResult

      if (
        typeof this?.options?.includePaths === 'string' &&
        this.options.includePaths.length > 0
      ) {
        const includePaths = this.options.includePaths.split(path.delimiter)
        const includedPathsResult = includedPathsResolver(url, includePaths)
        return includedPathsResult
      }

      return null
    },
  })
)

/**
 * @typedef {(
 *   prev: string,
 *   url: string,
 *   callback: (error: Error, result: string|null) => void
 * ) => void} WebpackResolver
 */

/**
 * Create a YAML importer for sass-loader
 *
 * @param {any} loaderContext The loader context object passed to the 'sassOptions' function
 * @returns {Sass.Importer<'async'>}
 */
function createSassLoaderYamlImporter(loaderContext) {
  const resolveRequest = /** @type {WebpackResolver} */ (
    loaderContext.getResolve({
      extensions: ['.js', '.mjs', '.cjs'],
      preferRelative: true,
    })
  )

  return createYamlImporter({
    resolve: (url, prev) =>
      new Promise((resolve, reject) => {
        const fsResult = fsResolver(url, prev)
        if (fsResult) {
          resolve(fsResult)
          return
        }

        resolveRequest.call(null, prev, url, (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        })
      }),
  })
}

/**
 * Create a legacy YAML importer for sass-loader
 *
 * @param {any} loaderContext The loader context object passed to the 'sassOptions' function
 * @returns {Sass.LegacyAsyncImporter}
 */
function createSassLoaderLegacyYamlImporter(loaderContext) {
  const resolveRequest = /** @type {WebpackResolver} */ (
    loaderContext.getResolve({
      extensions: ['.js', '.mjs', '.cjs'],
      preferRelative: true,
    })
  )

  return createLegacyYamlImporter({
    resolve: (url, prev) =>
      new Promise((resolve, reject) => {
        const fsResult = fsResolver(url, prev)
        if (fsResult) {
          resolve(fsResult)
          return
        }

        resolveRequest(prev, url, (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        })
      }),
  })
}

exports.yamlImporter = yamlImporter
exports.legacyYamlImporter = legacyYamlImporter
exports.createSassLoaderYamlImporter = createSassLoaderYamlImporter
exports.createSassLoaderLegacyYamlImporter = createSassLoaderLegacyYamlImporter
