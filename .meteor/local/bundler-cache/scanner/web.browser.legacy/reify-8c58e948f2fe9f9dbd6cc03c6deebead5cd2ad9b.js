(function() {
  var getPrototypeOf;

  getPrototypeOf = Object.getPrototypeOf;

  if (!getPrototypeOf) {
    getPrototypeOf = function(obj) {
      return obj.__proto__;
    };
  }

  module.exports = getPrototypeOf;

}).call(this);

//# sourceMappingURL=getPrototypeOf.js.map
