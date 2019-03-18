import { Accounts } from 'meteor/accounts-base';
import { e2e } from '../client';

Accounts.onLogout(() => {
	e2e.stopClient();
});
