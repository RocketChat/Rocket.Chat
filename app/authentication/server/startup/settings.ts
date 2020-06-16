import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';

Meteor.startup(function() {
	settings.addGroup('Accounts', function() {
		this.section('Failed_Login_Attempts', function() {
			this.add('Accounts_Block_Failed_Login_Attempts_By_User', true, { type: 'boolean' });
			this.add('Accounts_Block_Failed_Attempts_Until_Block_By_User', 10, { type: 'int' });
			this.add('Accounts_Block_Failed_Attempts_Time_To_Unblock_By_User_In_Minutes', 5, { type: 'int' });
			this.add('Accounts_Block_Failed_Login_Attempts_By_Ip', true, { type: 'boolean' });
			this.add('Accounts_Block_Failed_Attempts_Until_Block_By_Ip', 50, { type: 'int' });
			this.add('Accounts_Block_Failed_Attempts_Time_To_Unblock_By_Ip_In_Minutes', 5, { type: 'int' });
			this.add('Accounts_Block_Failed_Attempts_Ip_Whitelist', '', { type: 'string' });

			this.add('Accounts_FailedLoginAudit_Enabled', false, { type: 'boolean' });
			this.add('Accounts_FailedLoginAudit_Log_Username', false, {
				type: 'boolean',
				enableQuery: { _id: 'Accounts_FailedLoginAudit_Enabled', value: true },
			});
			this.add('Accounts_FailedLoginAudit_Log_UserAgent', false, {
				type: 'boolean',
				enableQuery: { _id: 'Accounts_FailedLoginAudit_Enabled', value: true },
			});
			this.add('Accounts_FailedLoginAudit_Log_ClientIp', false, {
				type: 'boolean',
				enableQuery: { _id: 'Accounts_FailedLoginAudit_Enabled', value: true },
			});
			this.add('Accounts_FailedLoginAudit_Log_ForwardedForIp', false, {
				type: 'boolean',
				enableQuery: { _id: 'Accounts_FailedLoginAudit_Enabled', value: true },
			});
		});
	});
});
