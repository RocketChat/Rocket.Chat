import { Meteor } from 'meteor/meteor';
import { settings } from '../../settings';

Meteor.startup(() => {
	settings.addGroup('Discussion', function() {
		// the channel for which discussions are created if none is explicitly chosen

		this.add('Discussion_enabled', true, {
			group: 'Discussion',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
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
