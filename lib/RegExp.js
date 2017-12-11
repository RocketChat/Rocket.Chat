RegExp.escape = function(s) {
	return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
