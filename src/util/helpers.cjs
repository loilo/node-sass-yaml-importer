/**
 * Check if the provided value is a plain object
 *
 * @param {any} value
 * @returns {value is Record<string, any>}
 */
function isPlainObject(value) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  }

  if (value.constructor === undefined) {
    return true
  }

  if (
    Object.prototype.toString.call(value.constructor.prototype) !==
    '[object Object]'
  ) {
    return false
  }

  if (!value.constructor.prototype.hasOwnProperty('isPrototypeOf')) {
    return false
  }

  return true
}

/**
 * Check if value is a Promise
 *
 * @param {any} value
 * @returns {value is PromiseLike<unknown>}
 */
function isPromiseLike(value) {
  return typeof value?.then === 'function'
}

exports.isPlainObject = isPlainObject
exports.isPromiseLike = isPromiseLike
