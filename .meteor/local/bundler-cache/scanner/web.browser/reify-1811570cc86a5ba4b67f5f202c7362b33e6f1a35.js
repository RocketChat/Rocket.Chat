var extend = require('./_extend');

module.exports = function(ctor, superCtors) {
  extend(ctor.prototype, superCtors.prototype);
  return ctor;
};
