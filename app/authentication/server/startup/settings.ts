import { Meteor } from 'meteor/meteor';

import { settingsRegistry } from '../../../settings/server';

Meteor.startup(function () {
	settingsRegistry.addGroup('Accounts', function () {
		const enableQueryCollectData = { _id: 'Block_Multiple_Failed_Logins_Enabled', value: true };

		this.section('Login_Attempts', function () {
			this.add('Block_Multiple_Failed_Logins_Enabled', false, {
				type: 'boolean',
			});

			this.add('Block_Multiple_Failed_Logins_By_User', true, {
				type: 'boolean',
				enableQuery: enableQueryCollectData,
			});

			const enableQueryByUser = [enableQueryCollectData, { _id: 'Block_Multiple_Failed_Logins_By_User', value: true }];

			this.add('Block_Multiple_Failed_Logins_Attempts_Until_Block_by_User', 10, {
				type: 'int',
				enableQuery: enableQueryByUser,
			});

			this.add('Block_Multiple_Failed_Logins_Time_To_Unblock_By_User_In_Minutes', 5, {
				type: 'int',
				enableQuery: enableQueryByUser,
			});

			this.add('Block_Multiple_Failed_Logins_By_Ip', true, {
				type: 'boolean',
				enableQuery: enableQueryCollectData,
			});

			const enableQueryByIp = [enableQueryCollectData, { _id: 'Block_Multiple_Failed_Logins_By_Ip', value: true }];

			this.add('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip', 50, {
				type: 'int',
				enableQuery: enableQueryByIp,
			});

			this.add('Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes', 5, {
				type: 'int',
				enableQuery: enableQueryByIp,
			});

			this.add('Block_Multiple_Failed_Logins_Ip_Whitelist', '', {
				type: 'string',
				enableQuery: enableQueryByIp,
			});

			this.add('Block_Multiple_Failed_Logins_Notify_Failed', false, {
				type: 'boolean',
				enableQuery: [enableQueryCollectData],
			});

			this.add('Block_Multiple_Failed_Logins_Notify_Failed_Channel', '', {
				type: 'string',
				i18nDescription: 'Block_Multiple_Failed_Logins_Notify_Failed_Channel_Desc',
				enableQuery: [enableQueryCollectData, { _id: 'Block_Multiple_Failed_Logins_Notify_Failed', value: true }],
			});
		});

		this.section('Login_Logs', function () {
			const enableQueryAudit = { _id: 'Login_Logs_Enabled', value: true };

			this.add('Login_Logs_Enabled', false, { type: 'boolean' });

			this.add('Login_Logs_Username', false, { type: 'boolean', enableQuery: enableQueryAudit });

			this.add('Login_Logs_UserAgent', false, { type: 'boolean', enableQuery: enableQueryAudit });

			this.add('Login_Logs_ClientIp', false, { type: 'boolean', enableQuery: enableQueryAudit });

			this.add('Login_Logs_ForwardedForIp', false, {
				type: 'boolean',
				enableQuery: enableQueryAudit,
			});
		});
	});
});
