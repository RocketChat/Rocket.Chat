Meteor.startup(function() {
	RocketChat.settings.addGroup('AtlassianCrowd', function() {
		const enableQuery = {_id: 'CROWD_Enable', value: true};
		this.add('CROWD_Enable', false, { type: 'boolean', public: true, i18nLabel: 'Enabled' });
		this.add('CROWD_URL', '', { type: 'string', enableQuery, i18nLabel: 'URL' });
		this.add('CROWD_Reject_Unauthorized', true, { type: 'boolean', enableQuery });
		this.add('CROWD_APP_USERNAME', '', { type: 'string', enableQuery, i18nLabel: 'Username' });
		this.add('CROWD_APP_PASSWORD', '', { type: 'password', enableQuery, i18nLabel: 'Password' });
		this.add('CROWD_Sync_User_Data', false, { type: 'boolean', enableQuery, i18nLabel: 'Sync_Users' });
		this.add('CROWD_Test_Connection', 'crowd_test_connection', { type: 'action', actionText: 'Test_Connection', i18nLabel: 'Test_Connection' });
	});
});
