import { Meteor } from 'meteor/meteor';
import { settings } from '../../settings';

import { Threads } from './constants';

Meteor.startup(() => {
	settings.addGroup('Threading', function() {
		// the channel for which threads are created if none is explicitly chosen

		this.add('Thread_enabled', true, {
			group: 'Threading',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
		});

		const enableQuery = { _id: 'Thread_enabled', value: true };


		this.add('Thread_send_creation_message', Threads.SEND_CREATION_MESSAGE.ALWAYS, {
			group: 'Threading',
			i18nLabel: 'Send creation message',
			type: 'select',
			values: [
				{ key: Threads.SEND_CREATION_MESSAGE.ALWAYS, i18nLabel: 'Always' },
				{ key: Threads.SEND_CREATION_MESSAGE.OLD_MESSAGES, i18nLabel: 'Old messages' },
				{ key: Threads.SEND_CREATION_MESSAGE.NEVER, i18nLabel: 'Never' },
			],
			public: true,
			enableQuery,
		});

	});

	settings.add('Accounts_Default_User_Preferences_sidebarShowThreads', true, {
		group: 'Accounts',
		section: 'Accounts_Default_User_Preferences',
		type: 'boolean',
		public: true,
		i18nLabel: 'Group_threads',
	});

	const globalQuery = {
		_id: 'RetentionPolicy_Enabled',
		value: true,
	};

	settings.add('RetentionPolicy_DoNotExcludeThreads', true, {
		group: 'RetentionPolicy',
		section: 'Global Policy',
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_DoNotExcludeThreads',
		i18nDescription: 'RetentionPolicy_DoNotExcludeThreads_Description',
		enableQuery: globalQuery,
	});
});
