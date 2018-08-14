function getParentChannels() {
	const result = Meteor.call('getParentChannelList', {sort: 'name'});
	if (!result) {
		return [{
			key: 'general',
			i18nLabel: 'general'
		}];
	}
	return result.channels.map((channel) => {
		if (channel.name !== null) {
			return {
				key: channel.name,
				i18nLabel: channel.name
			};
		}
	});
}

Meteor.startup(() => {
	RocketChat.settings.addGroup('Threading');

	RocketChat.settings.add('Thread_Count', 1, {
		group: 'Threading',
		i18nLabel: 'Thread_count',
		type: 'int',
		public: true
	});
	RocketChat.settings.add('Select_Parent', false, {
		group: 'Threading',
		i18nLabel: 'Select_Parent',
		type: 'boolean',
		public: true
	});

	RocketChat.settings.add('Parent_Channel', '', {
		group: 'Threading',
		i18nLabel: 'Parent_Channel',
		type: 'select',
		values: getParentChannels(), // load parent channels
		public: true,
		enableQuery: {_id: 'Select_Parent', value: true}
	});
});


