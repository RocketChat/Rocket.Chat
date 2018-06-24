Meteor.startup(function() {
	RocketChat.settings.addGroup('AtlassianCrowd', function() {
		const enableQuery = {_id: 'CROWD_Enable', value: true};
		this.add('CROWD_Enable', false, { type: 'boolean', public: true, i18nLabel: 'Enabled' });
		this.add('CROWD_URL', '', { type: 'string', enableQuery, i18nLabel: 'URL' });
		this.add('CROWD_Reject_Unauthorized', true, { type: 'boolean', enableQuery });
		this.add('CROWD_APP_USERNAME', '', { type: 'string', enableQuery, i18nLabel: 'Username' });
		this.add('CROWD_APP_PASSWORD', '', { type: 'password', enableQuery, i18nLabel: 'Password' });
		this.add('CROWD_Sync_User_Data', false, { type: 'boolean', enableQuery, i18nLabel: 'Sync_Users' });
		this.add('CROWD_SYNC_INTERVAL', 60, { type: 'int', enableQuery, i18nLabel: 'Sync_Interval', i18nDescription: 'Crowd_sync_interval_Description' });
		this.add('CROWD_SYNC_INTERVAL', 60, { 
			type: 'select',
			values: [
				{ key: 15, i18nLabel: '15_minutes' },
				{ key: 30, i18nLabel: '30_minutes' },
				{ key: 60, i18nLabel: '1_hour' },
				{ key: 120, i18nLabel: '2_hours' },
				{ key: 240, i18nLabel: '4_hours' },
				{ key: 720, i18nLabel: '12_hours' },
				{ key: 1440, i18nLabel: '24_hours' }
			], 
			enableQuery, 
			i18nLabel: 'Sync_Interval', 
			i18nDescription: 'Crowd_sync_interval_Description' 
		});
		this.add('CROWD_CLEAN_USERNAMES', true, { type: 'boolean', enableQuery, i18nLabel: 'Clean_Usernames', i18nDescription: 'Crowd_clean_usernames_Description' });
		this.add('CROWD_Test_Connection', 'crowd_test_connection', { type: 'action', actionText: 'Test_Connection', i18nLabel: 'Test_Connection' });
		this.add('CROWD_SYNC_USERS', 'crowd_sync_users', { type: 'action', actionText: 'Sync_User_Data', i18nLabel: 'Sync_User_Data' });
	});
});