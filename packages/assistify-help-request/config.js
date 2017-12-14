const _createExpertsChannel = function() {
	const expertsRoomName = RocketChat.settings.get('Assistify_Expert_Channel');

	if (RocketChat.models.Rooms.findByNameContaining(expertsRoomName).fetch().length === 0) {
		RocketChat.models.Rooms.createWithIdTypeAndName(Random.id(), 'c', expertsRoomName);
	}
};

Meteor.startup(() => {



	RocketChat.settings.add('Assistify_Room_Count', 1, {
		group: 'Assistify',
		i18nLabel: 'Assistify_room_count',
		type: 'int',
		public: true,
		section: 'General'
	});

	RocketChat.settings.add('Assistify_Expert_Channel', TAPi18n.__('Experts'), {
		group: 'Assistify',
		i18nLabel: 'Experts_channel',
		type: 'string',
		public: true,
		section: 'General'
	});

	RocketChat.settings.add('Assistify_Deactivate_request_closing_comments', false, {
		group: 'Assistify',
		i18nLabel: 'Deactivate_close_comment',
		type: 'boolean',
		section:'General',
		public: true
	});

	_createExpertsChannel();

	RocketChat.theme.addPackageAsset(() => {
		return Assets.getText('assets/stylesheets/helpRequestContext.less');
	});
});
