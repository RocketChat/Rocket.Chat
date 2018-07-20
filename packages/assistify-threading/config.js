Meteor.startup(() => {
	RocketChat.settings.add('Thread_Count', 1, {
		group: 'General',
		i18nLabel: 'Thread_count',
		type: 'int',
		public: true,
		section: 'General'
	});
});
