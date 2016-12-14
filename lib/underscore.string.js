/* globals mixin */

// This will add underscore.string methods to Underscore.js
// except for include, contains, reverse and join that are
// dropped because they collide with the functions already
// defined by Underscore.js.

mixin = function(obj) {
	_.each(_.functions(obj), function(name) {
		if (!_[name] && !_.prototype[name]) {
			_[name] = obj[name];
		}
	});
};

mixin(s.exports());
