/* globals isFirefox */

Template.icon.helpers({
	baseUrl() {
		if (isFirefox) {
			return window.location.href.replace(window.location.hash, '');
		}

		return '';
	}
});
