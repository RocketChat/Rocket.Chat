Meteor.startup(function() {
	if (RocketChat.OTR && RocketChat.OTR.enabled) {
		RocketChat.TabBar.addButton({
			groups: ['directmessage'],
			id: 'otr',
			i18nTitle: 'OTR',
			icon: 'icon-key-1',
			template: 'otrFlexTab',
			order: 11
		})
	}
});