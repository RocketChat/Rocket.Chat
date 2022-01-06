import { Meteor } from 'meteor/meteor';

import { settingsRegistry } from '../../settings/server';

Meteor.startup(function () {
	settingsRegistry.addGroup('AtlassianCrowd', function () {
		const enableQuery = { _id: 'CROWD_Enable', value: true };
		const enableSyncQuery = [enableQuery, { _id: 'CROWD_Sync_User_Data', value: true }];

		this.add('CROWD_Enable', false, { type: 'boolean', public: true, i18nLabel: 'Enabled' });
		this.add('CROWD_URL', '', { type: 'string', enableQuery, i18nLabel: 'URL' });
		this.add('CROWD_Reject_Unauthorized', true, { type: 'boolean', enableQuery });
		this.add('CROWD_APP_USERNAME', '', {
			type: 'string',
			enableQuery,
			i18nLabel: 'Username',
			secret: true,
		});
		this.add('CROWD_APP_PASSWORD', '', {
			type: 'password',
			enableQuery,
			i18nLabel: 'Password',
			secret: true,
		});
		this.add('CROWD_Sync_User_Data', false, {
			type: 'boolean',
			enableQuery,
			i18nLabel: 'Sync_Users',
		});
		this.add('CROWD_Sync_Interval', 'Every 60 mins', {
			type: 'string',
			enableQuery: enableSyncQuery,
			i18nLabel: 'Sync_Interval',
			i18nDescription: 'Crowd_sync_interval_Description',
		});
		this.add('CROWD_Remove_Orphaned_Users', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'Crowd_Remove_Orphaned_Users',
		});
		this.add('CROWD_Clean_Usernames', true, {
			type: 'boolean',
			enableQuery,
			i18nLabel: 'Clean_Usernames',
			i18nDescription: 'Crowd_clean_usernames_Description',
		});
		this.add('CROWD_Allow_Custom_Username', true, {
			type: 'boolean',
			i18nLabel: 'CROWD_Allow_Custom_Username',
		});
		this.add('CROWD_Test_Connection', 'crowd_test_connection', {
			type: 'action',
			actionText: 'Test_Connection',
			i18nLabel: 'Test_Connection',
		});
		this.add('CROWD_Sync_Users', 'crowd_sync_users', {
			type: 'action',
			actionText: 'Sync_Users',
			i18nLabel: 'Sync_Users',
		});
	});
});
