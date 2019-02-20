import { Meteor } from 'meteor/meteor';
import { settings } from 'meteor/rocketchat:settings';

Meteor.startup(() => {
	settings.addGroup('Threading', function() {
		// the channel for which threads are created if none is explicitly chosen
		this.add('Thread_invitations_threshold', 10, {
			group: 'Threading',
			i18nLabel: 'Thread_invitations_threshold',
			i18nDescription: 'Thread_invitations_threshold_description',
			type: 'int',
			public: true,
		});

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

		this.add('Accounts_Default_User_Preferences_sidebarShowThreads', true, {
			group: 'Accounts',
			section: 'Accounts_Default_User_Preferences',
			type: 'boolean',
			public: true,
			i18nLabel: 'Threads_in_sidebar',
		});

		// this is a technical counter which allows for generation of unique room names
		this.add('Thread_Count', 1, {
			group: 'Threading',
			i18nLabel: 'Thread_count',
			type: 'int',
			public: false,
			hidden: true,
		});


		const globalQuery = {
			_id: 'RetentionPolicy_Enabled',
			value: true,
		};

		this.add('RetentionPolicy_ExcludeThreads', false, {
			group:'RetentionPolicy',
			type: 'boolean',
			public: true,
			i18nLabel: 'RetentionPolicy_ExcludeThreads',
			i18nDescription: 'RetentionPolicy_ExcludeThreads_Description',
			enableQuery: globalQuery,
		});
	});
});
