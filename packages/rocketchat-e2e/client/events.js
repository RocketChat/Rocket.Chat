import { Accounts } from 'meteor/accounts-base';
import { e2e } from 'meteor/rocketchat:e2e';

Accounts.onLogout(() => {
	e2e.stopClient();
});
