Meteor.startup(() => {
	if (!Meteor.isCordova) { return; }
	// Handle click events for all external URLs
	document.addEventListener('deviceready', () => {
		// const platform = device.platform.toLowerCase();
		$(document).on('click', function(e) {
			const $link = $(e.target).closest('a[href]');
			if (!($link.length > 0)) { return; }
			const url = $link.attr('href');

			if (/^https?:\/\/.+/i.test(url) === true) {
				window.open(url, '_system');
				return e.preventDefault();
			}
		});
	});
});
