/* globals KonchatNotification */

const focusWindow = new class {
	constructor() {
		this.debug = false;
		this.isFocused = true;
	}

	blur() {
		return this.isFocused = false;
	}

	focus() {
		if (!this.isFocused) {
			KonchatNotification.focusWindow();
		}
		return this.isFocused = true;
	}
};


Meteor.startup(function() {
	$(window).on('blur', () => {
		focusWindow.blur();
	});

	$(window).on('focus', () => {
		focusWindow.focus();
	});
});
export { focusWindow };
this.focusWindow = focusWindow;
