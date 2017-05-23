Helpers.equals = function (a, b) {
	return a == b; // Intentional double comarison due to object-like strings in Spacebars
};

Helpers.activeIf = function (a, b, active) {
	if (a == b) return _.isString(active) ? active : '_active';
	return '';
};

// Helpers.spinnerIf = function(value, options) {
//   console.log("SI", value, options, this, arguments);
//   return 'SPINNER IF';
// };
