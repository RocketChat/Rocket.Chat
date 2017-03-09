Meteor.startup(() => {
	RocketChat.settings.add('Assistify_Room_Count', 1, {
		group: 'Assistify',
		i18nLabel: 'Assistify_room_count',
		type: 'int',
		public: true
	});

	RocketChat.theme.addPackageAsset(() => {
		return Assets.getText('assets/stylesheets/helpRequestContext.less');
	});
});
