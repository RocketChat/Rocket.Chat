var toString = Object.prototype.toString;

module.exports = Array.isArray ? Array.isArray : function isArray(obj) {
    return toString.call(obj) === "[object Array]";
  };
