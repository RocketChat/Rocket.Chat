import { useSetting } from '@rocket.chat/ui-contexts';

import AccountProfilePage from './AccountProfilePage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const AccountProfileRoute = () => {
	const canViewProfile = useSetting('Accounts_AllowUserProfileChange');

	if (!canViewProfile) {
		return <NotAuthorizedPage />;
	}

	return <AccountProfilePage />;
};

export default AccountProfileRoute;
