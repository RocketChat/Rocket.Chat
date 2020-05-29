import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';

Meteor.startup(function() {
	settings.addGroup('Accounts', function() {
		this.section('Failed_Login_Attempts', function() {
			this.add('Accounts_Block_Failed_Login_Attempts_By_User', true, { type: 'boolean' });
			this.add('Accounts_Block_Failed_Attempts_Until_Block_By_User', 10, { type: 'int' });
			this.add('Accounts_Block_Failed_Attempts_Time_To_Unblock_By_User_In_Minutes', 5, { type: 'int' });
			this.add('Accounts_Block_Failed_Login_Attempts_By_Ip', true, { type: 'boolean' });
			this.add('Accounts_Block_Failed_Attempts_Until_Block_By_Ip', 10, { type: 'int' });
			this.add('Accounts_Block_Failed_Attempts_Time_To_Unblock_By_Ip_In_Minutes', 5, { type: 'int' });
			this.add('Accounts_Block_Failed_Attempts_Ip_Whitelist', '', { type: 'string' });
		});
	});
});
