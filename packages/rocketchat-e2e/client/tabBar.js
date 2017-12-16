Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('E2E_Enable') && window.crypto) {
			RocketChat.E2E.crypto = window.crypto.subtle || window.crypto.webkitSubtle;
			RocketChat.E2E.enabled.set(true);
			RocketChat.TabBar.addButton({
				groups: ['direct', 'group'],
				id: 'e2e',
				i18nTitle: 'E2E',
				icon: 'icon-key',
				template: 'e2eFlexTab',
				order: 12
			});
		} else {
			RocketChat.E2E.enabled.set(false);
			RocketChat.TabBar.removeButton('e2e');
		}
	});
});
