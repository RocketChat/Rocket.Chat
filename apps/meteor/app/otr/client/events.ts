import OTR from './OTR';
import { accounts } from '../../../client/meteor/facade/accounts';

accounts.onLogout(() => {
	OTR.closeAllInstances();
});
