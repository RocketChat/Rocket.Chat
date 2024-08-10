import { Accounts } from 'meteor/accounts-base';

import OTR from './OTR';

Accounts.onLogout(() => {
	OTR.closeAllInstances();
});
