Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('OTR_Enable') && window.crypto) {
			RocketChat.OTR.crypto = window.crypto.subtle || window.crypto.webkitSubtle;
			RocketChat.OTR.enabled.set(true);
			RocketChat.TabBar.addButton({
				groups: ['direct'],
				id: 'otr',
				i18nTitle: 'OTR',
				icon: 'key',
				template: 'otrFlexTab',
				order: 11
			});
		} else {
			RocketChat.OTR.enabled.set(false);
			RocketChat.TabBar.removeButton('otr');
		}
	});
});
