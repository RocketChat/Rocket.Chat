import { Meteor } from 'meteor/meteor';
import { settings } from '../../settings';

Meteor.startup(() => {
	settings.addGroup('Threading', function() {
		// the channel for which threads are created if none is explicitly chosen

		this.add('Thread_from_context_menu', 'button', {
			group: 'Threading',
			i18nLabel: 'Thread_from_context_menu',
			type: 'select',
			values: [
				{ key: 'button', i18nLabel: 'Threading_context_menu_button' },
				{ key: 'none', i18nLabel: 'Threading_context_menu_none' },
			],
			public: true,
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
