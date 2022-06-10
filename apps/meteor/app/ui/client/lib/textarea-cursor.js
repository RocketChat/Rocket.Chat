// http://stackoverflow.com/a/499158

$.fn.setCursorPosition = function (pos) {
	this.each((index, element) => {
		const p = pos < 0 ? element.value.length - pos : pos;
		if (element.setSelectionRange) {
			element.setSelectionRange(p, p);
		} else if (element.createTextRange) {
			const range = element.createTextRange();
			range.collapse(true);
			range.moveEnd('character', p);
			range.moveStart('character', p);
			range.select();
		}
	});

	return this;
};
