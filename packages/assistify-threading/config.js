Meteor.startup(() => {
	RocketChat.settings.add('Thread_Count', 1, {
		group: 'General',
		i18nLabel: 'Thread_count',
		type: 'int',
		public: true,
		section: 'General'
	});
	RocketChat.settings.add('Select_Parent', false, {
		group: 'General',
		i18nLabel: 'Select_Parent',
		type: 'boolean',
		public: true,
		section: 'General'
	});
	RocketChat.settings.add('Parent_Channel', 'general', {
		group: 'General',
		i18nLabel: 'Parent_Channel',
		type: 'select',
		values: [{
			key: 'general',
			i18nLabel: 'General'
		}],
		public: true,
		section: 'General',
		enableQuery: { _id: 'Select_Parent', value : false }
	});
});
