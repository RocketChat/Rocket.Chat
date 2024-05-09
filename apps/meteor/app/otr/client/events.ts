import { Accounts } from 'meteor/accounts-base';

import OTR from './OTR';

Accounts.onLogout(() => {
	console.log('Logout');
	OTR.closeAllInstances();
});
