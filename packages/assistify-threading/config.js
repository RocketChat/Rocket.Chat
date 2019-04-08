import { Meteor } from 'meteor/meteor';
function getParentChannels() {
	const result = Meteor.call('getParentChannelList', { sort: 'name', default: -1 });

	return result.channels
		.filter((channel) => !!channel.name)
		.map((channel) => ({
			key: channel.name, // has to be "key" in order to be able to select it in the settings as dropdown
			i18nLabel: channel.name,
		}));
}

Meteor.startup(() => {
	RocketChat.settings.addGroup('Threading');

	// the channel for which threads are created if none is explicitly chosen
	let defaultChannel = '';

	const generalChannel = RocketChat.models.Rooms.findOneById('GENERAL');

	if (generalChannel) {
		defaultChannel = generalChannel.name;
	} else {
		const potentialParentChannels = getParentChannels();
		defaultChannel = potentialParentChannels[0] ? potentialParentChannels[0].key : '';
	}
	RocketChat.settings.add('Thread_default_parent_Channel', defaultChannel, {
		group: 'Threading',
		i18nLabel: 'Thread_default_parent_Channel',
		type: 'string',
		public: true,
	});

	// Set the default channel on each restart if unset
	if (!RocketChat.settings.get('Thread_default_parent_Channel')) {
		RocketChat.models.Settings.updateValueById('Thread_default_parent_Channel', defaultChannel);
	}

	RocketChat.settings.add('Thread_invitations_threshold', 10, {
		group: 'Threading',
		i18nLabel: 'Thread_invitations_threshold',
		i18nDescription: 'Thread_invitations_threshold_description',
		type: 'int',
		public: true,
	});

	RocketChat.settings.add('Thread_from_context_menu', 'button', {
		group: 'Threading',
		i18nLabel: 'Thread_from_context_menu',
		type: 'select',
		values: [
			{ key: 'button', i18nLabel: 'Threading_context_menu_button' },
			{ key: 'none', i18nLabel: 'Threading_context_menu_none' },
		],
		public: true,
	});

	RocketChat.settings.add('Accounts_Default_User_Preferences_sidebarShowThreads', true, {
		group: 'Accounts',
		section: 'Accounts_Default_User_Preferences',
		type: 'boolean',
		public: true,
		i18nLabel: 'Threads_in_sidebar',
	});

	// this is a technical counter which allows for generation of unique room names
	RocketChat.settings.add('Thread_Count', 1, {
		group: 'Threading',
		i18nLabel: 'Thread_count',
		type: 'int',
		public: false,
		hidden: true,
	});
});
