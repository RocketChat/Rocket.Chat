
/*jslint node: true */


/*
 *   the general Path Class
 */

(function() {
  'use strict';
  var Path, defineProperty, escapeStrRe, isArray, isNullOrUndefined, isObject, isString;

  defineProperty = require("util-ex/lib/defineProperty");

  isString = require('util-ex/lib/is/type/string');

  isArray = require('util-ex/lib/is/type/array');

  isObject = require('util-ex/lib/is/type/object');

  isNullOrUndefined = require('util-ex/lib/is/type/null-or-undefined');

  escapeStrRe = require('escape-string-regexp');

  module.exports = Path = (function() {
    var trimArray;

    Path.prototype._sepRe = /&SEP&/g;

    Path.prototype._sep = '/';

    Path.prototype._delimiter = ':';

    Path.prototype._splitPathReStr = '^(&SEP&?|)([\\s\\S]*?)((?:\\.{1,2}|[^' + '&SEP&]+?|)(\\.[^.&SEP&]*|))(?:[&SEP&]*)$';

    Path.isWindows = process.platform === 'win32';

    function Path(aOptions) {
      defineProperty(this, 'sep', void 0, {
        get: (function(_this) {
          return function() {
            return _this._sep;
          };
        })(this),
        set: (function(_this) {
          return function(value) {
            if (isString(value) && value.length === 1) {
              _this._sep = value;
              return _this.updateSplitPathRe();
            }
          };
        })(this)
      });
      defineProperty(this, 'delimiter', void 0, {
        get: (function(_this) {
          return function() {
            return _this._delimiter;
          };
        })(this),
        set: (function(_this) {
          return function(value) {
            if (isString(value) && value.length === 1) {
              return _this._delimiter = value;
            }
          };
        })(this)
      });
      defineProperty(this, 'splitPathReStr', void 0, {
        get: (function(_this) {
          return function() {
            return _this._splitPathReStr;
          };
        })(this),
        set: (function(_this) {
          return function(value) {
            if (isString(value) && _this._sepRe.test(value)) {
              _this._splitPathReStr = value;
              return _this.updateSplitPathRe();
            } else {
              throw new TypeError('It should be a string and include "&SEP&"');
            }
          };
        })(this)
      });
      if (isString(aOptions)) {
        this.sep = aOptions;
      } else if (isObject(aOptions)) {
        if (isString(aOptions.sep)) {
          this.sep = aOptions.sep;
        }
        if (isString(aOptions.delimiter)) {
          this.delimiter = aOptions.delimiter;
        }
        if (isString(aOptions.splitPathReStr)) {
          this.splitPathReStr = aOptions.splitPathReStr;
        }
      }
      if (!this.splitPathRe) {
        this.updateSplitPathRe();
      }
    }

    Path.prototype.isWindows = Path.isWindows;

    Path.prototype.updateSplitPathRe = function() {
      return this.splitPathRe = new RegExp(this._splitPathReStr.replace(this._sepRe, escapeStrRe(this._sep)));
    };

    Path.prototype.splitPath = function(filename) {
      return this.splitPathRe.exec(filename).slice(1);
    };

    Path.prototype.toArray = function(aPath) {

      /*
      while aPath.length and aPath[0] is _sep
        aPath = aPath.substring(1)
      while aPath.length and aPath[aPath.length - 1] is _sep
        aPath = aPath.substring(0, aPath.length - 1)
       */
      if (aPath && aPath.length) {
        return this.trimArray(aPath.split(this.sep));
      } else {
        return [];
      }
    };

    Path.prototype.normalizeArray = function(parts, allowAboveRoot) {
      var i, p, res, vSep;
      res = [];
      i = 0;
      vSep = this._sep;
      if (isNullOrUndefined(allowAboveRoot) && parts[0] && parts[0].length) {
        switch (parts[i][0]) {
          case '.':
            allowAboveRoot = true;
            i++;
            if (parts[i - 1].length === 1) {
              while (i < parts.length && parts[i] === '.') {
                i++;
              }
            }
            break;
          case vSep:
            allowAboveRoot = false;
            i++;
            if (parts[i - 1].length === vSep.length) {
              while (i < parts.length && parts[i] === vSep) {
                i++;
              }
            }
        }
      }
      while (i < parts.length) {
        p = parts[i];
        if (!p || p === '.') {
          i++;
          continue;
        }
        if (p === '..') {
          if (res.length && res[res.length - 1] !== '..') {
            res.pop();
          } else if (allowAboveRoot) {
            res.push('..');
          }
        } else {
          res.push(p);
        }
        i++;
      }
      return res;
    };

    Path.prototype.trimArray = trimArray = function(arr) {
      var end, lastIndex, start;
      lastIndex = arr.length - 1;
      start = 0;
      while (start <= lastIndex) {
        if (arr[start]) {
          break;
        }
        start++;
      }
      end = lastIndex;
      while (end >= 0) {
        if (arr[end]) {
          break;
        }
        end--;
      }
      if (start === 0 && end === lastIndex) {
        return arr;
      }
      if (start > end) {
        return [];
      }
      return arr.slice(start, end + 1);
    };

    Path.prototype.isAbsolute = function(path) {
      return path.charAt(0) === this._sep;
    };

    Path.prototype.normalize = function(path) {
      var isAbsPath, trailingSlash;
      isAbsPath = this.isAbsolute(path);
      trailingSlash = path && path[path.length - 1] === this._sep;
      path = this.normalizeArray(path.split(this._sep), !isAbsPath).join(this._sep);
      if (!path && !isAbsPath) {
        path = '.';
      }
      if (path && trailingSlash) {
        path += this._sep;
      }
      if (isAbsPath) {
        path = this._sep + path;
      }
      return path;
    };

    Path.prototype.cwd = function() {
      return '.';
    };

    Path.prototype.resolveArray = function() {
      var i, resolvedAbsolute, resolvedPath, vCwd, vPath;
      resolvedPath = [];
      vCwd = this.cwd();
      i = arguments.length;
      while (--i >= -1 && !resolvedAbsolute) {
        vPath = i >= 0 ? arguments[i] : vCwd;
        if (isArray(vPath)) {
          if (vPath.length === 0) {
            resolvedAbsolute = true;
          } else {
            resolvedPath = vPath.filter(Boolean).concat(resolvedPath);
            resolvedAbsolute = vPath[0] !== '.';
          }
          continue;
        } else if (vPath == null) {
          continue;
        } else if (!isString(vPath)) {
          throw new TypeError('Arguments to path.resolve must be string or array');
        }
        resolvedPath = vPath.split(this._sep).filter(Boolean).concat(resolvedPath);
        resolvedAbsolute = vPath.charAt(0) === this._sep;
      }
      resolvedPath = this.normalizeArray(resolvedPath, !resolvedAbsolute);
      resolvedPath.unshift(resolvedAbsolute ? this._sep : '.');
      return resolvedPath;
    };

    Path.prototype.resolve = function() {
      var resolvedPath, root;
      resolvedPath = this.resolveArray.apply(this, arguments);
      root = resolvedPath[0];
      if (root === '.') {
        root = '';
      }
      resolvedPath.shift(0, 1);
      return (root + resolvedPath.join(this._sep)) || '.';
    };

    Path.prototype._join = function() {
      var i, result, segment, vPathSep;
      result = [];
      vPathSep = this._sep;
      i = -1;
      while (++i < arguments.length) {
        segment = arguments[i];
        if (isArray(segment)) {
          if (segment.length === 0) {
            segment = vPathSep;
          } else {
            segment = segment.filter(Boolean).join(vPathSep);
          }
        } else if (segment == null) {
          continue;
        } else if (!isString(segment)) {
          throw new TypeError('Arguments to path.join must be string or arrays');
        }
        if (segment) {
          result.push(segment);
        }
      }
      return result;
    };

    Path.prototype.join = function() {
      var result;
      result = this._join.apply(this, arguments);
      return this.normalize(result.join(this._sep));
    };

    Path.prototype._isSame = function(aDir1, aDir2) {
      return aDir1 === aDir2;
    };

    Path.prototype.relative = function(from, to) {
      var fromParts, i, length, outputParts, samePartsLength, toParts, vPathSep;
      vPathSep = this._sep;
      fromParts = this.resolveArray(from);
      toParts = this.resolveArray(to);
      fromParts.shift(0, 1);
      toParts.shift(0, 1);
      length = Math.min(fromParts.length, toParts.length);
      samePartsLength = length;
      i = -1;
      while (++i < length) {
        if (!this._isSame(fromParts[i], toParts[i])) {
          samePartsLength = i;
          break;
        }
      }
      outputParts = [];
      i = samePartsLength;
      while (i < fromParts.length) {
        outputParts.push('..');
        i++;
      }
      outputParts = outputParts.concat(toParts.slice(samePartsLength));
      return outputParts.join(vPathSep);
    };

    Path.prototype.dirname = function(path) {
      var dir, result, root;
      result = this.splitPath(path);
      root = result[0];
      dir = result[1];
      if (!root && !dir) {
        return '.';
      }
      if (dir) {
        dir = dir.substr(0, dir.length - 1);
      }
      return root + dir;
    };

    Path.prototype.basename = function(path, ext) {
      var f;
      f = this.splitPath(path)[2];
      if (ext && f.substr(-1 * ext.length) === ext) {
        f = f.substr(0, f.length - ext.length);
      }
      return f;
    };

    Path.prototype.replaceExt = function(path, ext) {
      var dir, f, oldExt, v;
      v = this.splitPath(path);
      f = v[2];
      dir = v[0] + v[1];
      oldExt = v[3];
      if (oldExt && f.substr(-1 * oldExt.length) === oldExt) {
        f = f.substr(0, f.length - oldExt.length);
      }
      return dir + f + ext;
    };

    Path.prototype.extname = function(path) {
      return this.splitPath(path)[3];
    };

    Path.prototype.format = function(pathObject) {
      var base, dir, root;
      if (!isObject(pathObject)) {
        throw new TypeError('Parameter \'pathObject\' must be an object, not ' + typeof pathObject);
      }
      root = pathObject.root || '';
      if (!isString(root)) {
        throw new TypeError('\'pathObject.root\' must be a string or undefined, not ' + typeof pathObject.root);
      }
      dir = pathObject.dir;
      if ((dir != null) && !isString(dir)) {
        throw new TypeError('\'pathObject.dir\' must be a string or undefined, not ' + typeof pathObject.dir);
      }
      base = pathObject.base || '';
      if (!dir) {
        dir = '';
      } else if (dir[dir.length - 1] !== this._sep) {
        dir += this._sep;
      }
      return dir + base;
    };

    Path.prototype.parse = function(pathString) {
      var allParts;
      if (!isString(pathString)) {
        throw new TypeError('Parameter \'pathString\' must be a string, not ' + typeof pathString);
      }
      allParts = this.splitPath(pathString);
      if (!allParts || allParts.length !== 4) {
        throw new TypeError('Invalid path \'' + pathString + '\'');
      }
      allParts[1] = allParts[1] || '';
      allParts[2] = allParts[2] || '';
      allParts[3] = allParts[3] || '';
      return {
        root: allParts[0],
        dir: allParts[0] + allParts[1].slice(0, -1),
        base: allParts[2],
        ext: allParts[3],
        name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
      };
    };

    Path.prototype._makeLong = function(path) {
      return path;
    };

    return Path;

  })();

  Path.path = new Path;

}).call(this);

//# sourceMappingURL=path.js.map
