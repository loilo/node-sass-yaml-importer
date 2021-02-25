import isPlainObject from 'is-plain-object'
import { readFileSync, existsSync } from 'fs'
import path, { resolve, dirname } from 'path'
import yaml from 'js-yaml'

export default function (url, prev) {
  if (!isValidDataFile(url)) {
    return null
  }

  let includePaths = this.options.includePaths
    ? this.options.includePaths.split(path.delimiter)
    : []
  let paths = [].concat(dirname(prev)).concat(includePaths)

  let file = paths
    .map(path => resolve(path, url))
    .filter(existsSync)
    .pop()

  if (!file) {
    return new Error(
      `Unable to find "${url}" from the following path(s): ${paths.join(
        ', '
      )}. Check includePaths.`
    )
  }

  try {
    return {
      contents: transformJSONtoSass(
        yaml.load(readFileSync(require.resolve(file), 'utf8'))
      )
    }
  } catch (e) {
    return new Error(
      `node-sass-yaml-importer: Error transforming YAML to SASS. Check if your YAML parses correctly. ${e}`
    )
  }
}

export function isValidDataFile(url) {
  return /\.(ya?ml|json)$/.test(url)
}

export function transformJSONtoSass(json) {
  return Object.keys(json)
    .map(key => `$${key}: ${parseValue(json[key])};`)
    .join('\n')
}

export function parseValue(value) {
  if (Array.isArray(value)) {
    return parseList(value)
  } else if (isPlainObject(value)) {
    return parseMap(value)
  } else {
    return value
  }
}

export function parseList(list) {
  return `(${list.map(value => `${parseValue(value)},`).join('')})`
}

export function parseMap(map) {
  return `(${Object.keys(map)
    .map(key => `'${key.replace(/'/g, "\\'")}': ${parseValue(map[key])},`)
    .join('')})`
}

// Super-hacky: Override Babel's transpiled export to provide both
// a default CommonJS export and named exports.
// Fixes: https://github.com/Updater/node-sass-json-importer/issues/32
// TODO: Remove in 3.0.0. Upgrade to Babel6.
module.exports = exports.default
Object.keys(exports).forEach(key => (module.exports[key] = exports[key]))
