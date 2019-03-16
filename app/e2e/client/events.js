import { Accounts } from 'meteor/accounts-base';
import { e2e } from '..';

Accounts.onLogout(() => {
	e2e.stopClient();
});
