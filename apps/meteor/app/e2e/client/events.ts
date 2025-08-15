import { e2e } from './rocketchat.e2e';
import { accounts } from '../../../client/meteor/facade/accounts';

accounts.onLogout(() => {
	void e2e.stopClient();
});
