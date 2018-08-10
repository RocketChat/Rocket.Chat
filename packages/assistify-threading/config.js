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
		values: [{ // TODO: generate select based on rooms available
			key: 'Threading',
			i18nLabel: 'Threading'
		}],
		public: true,
		enableQuery: { _id: 'Select_Parent', value : false }
	});
});
