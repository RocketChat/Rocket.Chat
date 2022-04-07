(function() {
  var defineProperty, isObject;

  isObject = function(o) {
    return o && typeof o === 'object';
  };

  defineProperty = Object.defineProperty;

  if (!defineProperty) {
    defineProperty = function(obj, key, descriptor) {
      var value;
      if (descriptor) {
        value = descriptor.value;
      }
      obj[key] = value;
    };
  }

  module.exports = function(object, key, value, aOptions) {
    var descriptor, isAccessor, writable;
    writable = true;
    descriptor = {
      configurable: true,
      enumerable: false
    };
    if (aOptions) {
      descriptor.enumerable = aOptions.enumerable === true;
      descriptor.configurable = aOptions.configurable !== false;
      if (aOptions.get) {
        isAccessor = true;
        descriptor.get = aOptions.get;
      }
      if (aOptions.set) {
        isAccessor = true;
        descriptor.set = aOptions.set;
      }
      writable = aOptions.writable !== false;
      if (value === void 0) {
        value = aOptions.value;
      }
    }
    if (!isAccessor) {
      descriptor.writable = writable;
      descriptor.value = value;
    }
    return defineProperty(object, key, descriptor);
  };

}).call(this);

//# sourceMappingURL=defineProperty.js.map
