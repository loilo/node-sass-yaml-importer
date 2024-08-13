const { isPlainObject } = require('../util/helpers.cjs')

// See https://sass-lang.com/documentation/values/strings/#unquoted
const unquotedStringPattern = /^(-?([a-z_]|[^ -~])|--)([a-z0-9_-]|[^ -~])*$/i
const quotedStringPattern = /^("([^"\\]|\\.)*"|'([^'\\]|\\.)*')$/gsu
const hexPattern = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * Transform a JavaScript record to Sass code defining each object key as a variable
 *
 * @param {Record<string, unknown>} object
 * @returns {string}
 */
function transformObjectToSassVariables(object) {
  return Object.keys(object)
    .map(key => `$${key}: ${transformJsValueToSassValue(object[key])};`)
    .join('\n')
}

/**
 * Transform a JavaScript value to Sass code
 *
 * @param {unknown} value
 * @returns {string}
 */
function transformJsValueToSassValue(value) {
  if (Array.isArray(value)) {
    return transformJsArrayToSassList(value)
  } else if (isPlainObject(value)) {
    return transformJsObjectToSassMap(value)
  } else if (
    typeof value === 'string' &&
    (hexPattern.test(value) ||
      unquotedStringPattern.test(value) ||
      quotedStringPattern.test(value))
  ) {
    return value
  } else {
    return JSON.stringify(value)
  }
}

/**
 * Transform a JavaScript array to Sass code
 *
 * @param {unknown[]} list
 * @returns {string}
 */
function transformJsArrayToSassList(list) {
  return `(${list
    .map(value => `${transformJsValueToSassValue(value)},`)
    .join('')})`
}

/**
 * Transform a JavaScript object to Sass code
 *
 * @param {Record<string, unknown>} map
 * @returns {string}
 */
function transformJsObjectToSassMap(map) {
  return `(${Object.keys(map)
    .map(
      key =>
        `'${key.replace(/'/g, "\\'")}': ${transformJsValueToSassValue(
          map[key],
        )},`,
    )
    .join('')})`
}

module.exports = transformObjectToSassVariables
