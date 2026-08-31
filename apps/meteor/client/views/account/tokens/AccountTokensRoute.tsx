import { usePermission } from '@rocket.chat/ui-contexts';

import AccountTokensPage from './AccountTokensPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const AccountTokensRoute = () => {
	const canCreateTokens = usePermission('create-personal-access-tokens');

	if (!canCreateTokens) {
		return <NotAuthorizedPage />;
	}

	return <AccountTokensPage />;
};

export default AccountTokensRoute;
