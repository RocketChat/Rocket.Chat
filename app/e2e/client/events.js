import { Accounts } from 'meteor/accounts-base';
import { e2e } from './rocketchat.e2e';

Accounts.onLogout(async function stopClient() {
	await e2e.stopClient();
});
