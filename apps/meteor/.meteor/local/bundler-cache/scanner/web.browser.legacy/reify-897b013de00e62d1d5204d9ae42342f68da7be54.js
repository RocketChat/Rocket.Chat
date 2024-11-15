(function() {
  'use strict';
  var Path, WinPath, inherits, isArray, isString;

  inherits = require('inherits-ex');

  isString = require('util-ex/lib/is/type/string');

  isArray = require('util-ex/lib/is/type/array');

  Path = require('../path');

  WinPath = (function() {
    var splitDeviceRe, splitTailRe;

    inherits(WinPath, Path);

    splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/.]+[\\\/]+[^\\\/.]+)?([\\\/])?([\s\S]*?)$/;

    splitTailRe = /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;

    function WinPath() {
      WinPath.__super__.constructor.call(this, {
        sep: '\\',
        delimiter: ';'
      });
    }

    WinPath.prototype.cwd = function() {
      return process.cwd().replace(/[\\\/]+/g, '\\');
    };

    WinPath.prototype._isSame = function(aDir1, aDir2) {
      return aDir1.toLowerCase() === aDir2.toLowerCase();
    };

    WinPath.prototype.normalizeUNCRoot = function(device) {
      return '\\\\' + device.replace(/^[\\\/]+/, '').replace(/[\\\/]+/g, '\\');
    };

    WinPath.prototype.toArray = function(aPath) {

      /*
      while aPath.length and aPath[0] is _sep
        aPath = aPath.substring(1)
      while aPath.length and aPath[aPath.length - 1] is _sep
        aPath = aPath.substring(0, aPath.length - 1)
       */
      var arr, result, root;
      if (aPath && aPath.length) {
        arr = this.splitPath(aPath);
        root = arr[0];
        result = this.trimArray(arr[1].split(/[\\\/]+/));
        if (root && (root !== '\\' || root !== '/')) {
          result.unshift(root);
        }
        result.push(arr[2]);
        result;
      } else {
        result = [];
      }
      return result;
    };

    WinPath.prototype.splitPath = function(filename) {
      var basename, device, dir, ext, result, result2, tail;
      result = splitDeviceRe.exec(filename);
      device = (result[1] || '') + (result[2] || '');
      tail = result[3] || '';
      result2 = splitTailRe.exec(tail);
      dir = result2[1];
      basename = result2[2];
      ext = result2[3];
      return [device, dir, basename, ext];
    };

    WinPath.prototype.statPath = function(path) {
      var device, isUnc, result;
      result = splitDeviceRe.exec(path);
      device = result[1] || '';
      isUnc = !!device && device[1] !== ':';
      return {
        device: device,
        isUnc: isUnc,
        isAbsolute: isUnc || !!result[2],
        tail: result[3]
      };
    };

    WinPath.prototype.isAbsolute = function(path) {
      return this.statPath(path).isAbsolute;
    };

    WinPath.prototype._makeLong = function(path) {
      var resolvedPath, result;
      if (!isString(path)) {
        return path;
      }
      if (!path) {
        return '';
      }
      resolvedPath = this.resolve(path);
      if (/^[a-zA-Z]\:\\/.test(resolvedPath)) {
        result = '\\\\?\\' + resolvedPath;
      } else if (/^\\\\[^?.]/.test(resolvedPath)) {
        result = '\\\\?\\UNC\\' + resolvedPath.substring(2);
      } else {
        result = path;
      }
      return result;
    };

    WinPath.prototype.join = function() {
      var result;
      result = this._join.apply(this, arguments);
      if (!(/^[\\\/]{2}[^\\\/]/.test(result[0]))) {
        result = result.join(this._sep);
        result = result.replace(/^[\\\/]{2,}/, '\\');
      } else {
        result = result.join(this._sep);
      }
      return this.normalize(result);
    };

    WinPath.prototype.normalize = function(path) {
      var device, isAbsolute, isUnc, result, tail, trailingSlash;
      result = this.statPath(path);
      device = result.device;
      isUnc = result.isUnc;
      isAbsolute = result.isAbsolute;
      tail = result.tail;
      trailingSlash = /[\\\/]$/.test(tail);
      tail = this.normalizeArray(tail.split(/[\\\/]+/), !isAbsolute).join('\\');
      if (!tail && !isAbsolute) {
        tail = '.';
      }
      if (tail && trailingSlash) {
        tail += this._sep;
      }
      if (isUnc) {
        device = this.normalizeUNCRoot(device);
      }
      return device + (isAbsolute ? '\\' : '') + tail;
    };

    WinPath.prototype.resolveArray = function() {
      var i, isUnc, resolveAbsolutePath, resolvedAbsolute, resolvedDevice, resolvedPath, tail, vCwd, vPath, vpath;
      resolvedPath = [];
      resolvedDevice = '';
      resolvedAbsolute = false;
      isUnc = false;
      tail = '';
      resolveAbsolutePath = (function(_this) {
        return function(aPath) {
          var device, result, st;
          st = _this.statPath(aPath);
          device = st.device;
          if (device && resolvedDevice && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            return false;
          }
          isUnc = st.isUnc;
          if (!resolvedDevice) {
            resolvedDevice = device;
          }
          tail = st.tail;
          result = resolvedAbsolute;
          if (!resolvedAbsolute) {
            resolvedAbsolute = st.isAbsolute;
          }
          return !result;
        };
      })(this);
      vCwd = this.cwd();
      i = arguments.length;
      while (--i >= -1 && !(resolvedAbsolute && resolvedDevice)) {
        if (i >= 0) {
          vPath = arguments[i];
        } else if (!resolvedDevice) {
          vPath = vCwd;
        } else {
          vpath = process.env['=' + resolvedDevice];
          if (!vpath || vpath.substr(0, 3).toLowerCase() !== resolvedDevice.toLowerCase() + '\\') {
            vpath = resolvedDevice + '\\';
          }
        }
        if (isArray(vPath)) {
          if (vPath.length === 0) {
            resolvedAbsolute = true;
          } else {
            if (resolveAbsolutePath(vPath[0])) {
              resolvedPath = vPath.slice(1).filter(Boolean).concat(resolvedPath);
            }
          }
          continue;
        } else if (vPath == null) {
          continue;
        } else if (!isString(vPath)) {
          throw new TypeError('Arguments to path.resolve must be string or array');
        }
        if (resolveAbsolutePath(vPath)) {
          resolvedPath = tail.split(/[\\\/]+/).filter(Boolean).concat(resolvedPath);
        }
      }
      if (isUnc) {
        resolvedDevice = this.normalizeUNCRoot(resolvedDevice);
      }
      resolvedPath = this.normalizeArray(resolvedPath, !resolvedAbsolute);
      resolvedDevice = resolvedDevice + (resolvedAbsolute ? this._sep : '');
      resolvedPath.unshift(resolvedDevice ? resolvedDevice : '.');
      return resolvedPath;
    };

    WinPath.prototype.relative = function(from, to) {
      var fromParts, i, length, outputParts, samePartsLength, toParts, vPathSep;
      vPathSep = this._sep;
      fromParts = this.resolveArray(from);
      toParts = this.resolveArray(to);
      length = Math.min(fromParts.length, toParts.length);
      samePartsLength = length;
      i = -1;
      while (++i < length) {
        if (!this._isSame(fromParts[i], toParts[i])) {
          samePartsLength = i;
          break;
        }
      }
      if (!samePartsLength) {
        return this.join(toParts);
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

    return WinPath;

  })();

  module.exports = new WinPath;

}).call(this);

//# sourceMappingURL=index.js.map
