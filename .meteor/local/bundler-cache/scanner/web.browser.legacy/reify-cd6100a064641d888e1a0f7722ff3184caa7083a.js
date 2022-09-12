"use strict";

exports.__esModule = true;
exports.default = void 0;

var pick = function pick(obj, keys) {
  var result = {};

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];

    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
  }

  return result;
};

var _default = pick;
exports.default = _default;