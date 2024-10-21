import { Accounts } from 'meteor/accounts-base';

import { e2e } from './rocketchat.e2e';

Accounts.onLogout(() => {
	void e2e.stopClient();
});
