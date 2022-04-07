(function() {
  var setPrototypeOf;

  setPrototypeOf = Object.setPrototypeOf;

  if (!setPrototypeOf) {
    setPrototypeOf = function(obj, prototype) {
      return obj.__proto__ = prototype;
    };
  }

  module.exports = setPrototypeOf;

}).call(this);

//# sourceMappingURL=setPrototypeOf.js.map
