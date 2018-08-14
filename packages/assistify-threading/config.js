function getParentChannels() {
	const result = Meteor.call('getParentChannelList', {sort: 'name', default: -1});

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

	const potentialParentChannels = getParentChannels();
	RocketChat.settings.add('Thread_default_parent_Channel', potentialParentChannels[0].name, {
		group: 'Threading',
		i18nLabel: 'Thread_default_parent_Channel',
		type: 'select',
		values: potentialParentChannels, // load parent channels
		public: true
	});

	RocketChat.settings.add('Accounts_Default_User_Preferences_sidebarShowThreads', true, {
		group: 'Accounts',
		section: 'Accounts_Default_User_Preferences',
		type: 'boolean',
		'public': true,
		i18nLabel: 'Threads_in_sidebar'
	});
});


