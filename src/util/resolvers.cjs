const fs = require('fs')
const path = require('path')

/**
 * Resolve a file request against the file system
 *
 * @param {string} request The path of the file to import
 * @param {string} previous The path of the file that requested the import
 * @returns {string|null}
 */
function fsResolver(request, previous) {
  const absolutePath = path.resolve(path.dirname(previous), request)
  if (!fs.existsSync(absolutePath)) return null
  return absolutePath
}

/**
 * Resolve a file request against a list of folders
 *
 * @param {string} request The path of the file to import
 * @param {string[]} includedPaths The list of folders to search in
 * @returns {string|null}
 */
function includedPathsResolver(request, includedPaths) {
  for (const includedPath of includedPaths) {
    const absolutePath = path.resolve(includedPath, request)
    if (fs.existsSync(absolutePath)) return absolutePath
  }

  return null
}

exports.fsResolver = fsResolver
exports.includedPathsResolver = includedPathsResolver
