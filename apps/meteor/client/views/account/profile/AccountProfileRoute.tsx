import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';

import AccountProfilePage from './AccountProfilePage';

const AccountProfileRoute = () => {
	const canViewProfile = useSetting('Accounts_AllowUserProfileChange');

	if (!canViewProfile) {
		return <NotAuthorizedPage />;
	}

	return <AccountProfilePage />;
};

export default AccountProfileRoute;
