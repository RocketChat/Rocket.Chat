import { useSetting } from '@rocket.chat/ui-contexts';

import AccountPasskeysPage from './AccountPasskeysPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const AccountPasskeysRoute = () => {
	const arePasskeysEnabled = useSetting('Accounts_Passkeys_Enabled', false);

	if (!arePasskeysEnabled) {
		return <NotAuthorizedPage />;
	}

	return <AccountPasskeysPage />;
};

export default AccountPasskeysRoute;
