function getParentChannels() {
	const result = Meteor.call('getParentChannelList', { sort: 'name', default: -1 });

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

	// the channel for which threads are created if none is explicitly chosen
	const potentialParentChannels = getParentChannels();
	const defaultChannel = potentialParentChannels[0] ? potentialParentChannels[0].key : '';
	RocketChat.settings.add('Thread_default_parent_Channel', defaultChannel, {
		group: 'Threading',
		i18nLabel: 'Thread_default_parent_Channel',
		type: 'string',
		public: true
	});

	// Set the default channel on each restart if unset
	if (!RocketChat.settings.get('Thread_default_parent_Channel')) {
		RocketChat.models.Settings.updateValueById('Thread_default_parent_Channel', defaultChannel);
	}

	RocketChat.settings.add('Accounts_Default_User_Preferences_sidebarShowThreads', true, {
		group: 'Accounts',
		section: 'Accounts_Default_User_Preferences',
		type: 'boolean',
		'public': true,
		i18nLabel: 'Threads_in_sidebar'
	});

	// this is a technical counter which allows for generation of unique room names
	RocketChat.settings.add('Thread_Count', 1, {
		group: 'Threading',
		i18nLabel: 'Thread_count',
		type: 'int',
		public: false
	});
});
