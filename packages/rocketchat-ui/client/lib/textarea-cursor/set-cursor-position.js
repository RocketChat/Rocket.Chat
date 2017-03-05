// Adapted from http://stackoverflow.com/a/499158

$.fn.setCursorPosition = function(pos) {
	this.each(function(index, elem) {
		var p = pos < 0 ? elem.value.length - pos : pos;
		if (elem.setSelectionRange) {
			elem.setSelectionRange(p, p);
		} else if (elem.createTextRange) {
			var range = elem.createTextRange();
			range.collapse(true);
			range.moveEnd('character', p);
			range.moveStart('character', p);
			range.select();
		}
	});
	return this;
};
