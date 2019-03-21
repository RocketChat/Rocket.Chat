import { Meteor } from 'meteor/meteor';
import { settings } from '../../settings';

import { Discussion } from './constants';

Meteor.startup(() => {
	settings.addGroup('Discussioning', function() {
		// the channel for which discussions are created if none is explicitly chosen

		this.add('Discussion_enabled', true, {
			group: 'Discussioning',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
		});

		const enableQuery = { _id: 'Discussion_enabled', value: true };


		this.add('Discussion_send_creation_message', Discussion.SEND_CREATION_MESSAGE.ALWAYS, {
			group: 'Discussioning',
			i18nLabel: 'Send creation message',
			type: 'select',
			values: [
				{ key: Discussion.SEND_CREATION_MESSAGE.ALWAYS, i18nLabel: 'Always' },
				{ key: Discussion.SEND_CREATION_MESSAGE.OLD_MESSAGES, i18nLabel: 'Old messages' },
				{ key: Discussion.SEND_CREATION_MESSAGE.NEVER, i18nLabel: 'Never' },
			],
			public: true,
			enableQuery,
		});

	});

	settings.add('Accounts_Default_User_Preferences_sidebarShowDiscussion', true, {
		group: 'Accounts',
		section: 'Accounts_Default_User_Preferences',
		type: 'boolean',
		public: true,
		i18nLabel: 'Group_discussions',
	});

	const globalQuery = {
		_id: 'RetentionPolicy_Enabled',
		value: true,
	};

	settings.add('RetentionPolicy_DoNotExcludeDiscussion', true, {
		group: 'RetentionPolicy',
		section: 'Global Policy',
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_DoNotExcludeDiscussion',
		i18nDescription: 'RetentionPolicy_DoNotExcludeDiscussion_Description',
		enableQuery: globalQuery,
	});
});
