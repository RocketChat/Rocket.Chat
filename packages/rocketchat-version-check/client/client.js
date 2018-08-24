/* globals alerts */

Meteor.startup(function() {
	Tracker.autorun(() => {
		const user = Meteor.user();

		if (user && Object.keys(user.banners || {}).length > 0) {
			const firstBanner = Object.values(user.banners).sort((a, b) => b.priority - a.priority)[0];
			firstBanner.textArguments = firstBanner.textArguments || [];

			alerts.open({
				title: TAPi18n.__(firstBanner.title),
				text: TAPi18n.__(firstBanner.text, ...firstBanner.textArguments),
				modifiers: firstBanner.modifiers,
				action() {
					if (firstBanner.link) {
						window.open(firstBanner.link, '_system');
					}
				},
				onClose() {
					Meteor.call('banner/dismiss', {
						id: firstBanner.id
					});
				}
			});
		}
	});
});
