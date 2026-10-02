import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import AccountTokensPage from './AccountTokensPage';

const AccountTokensRoute = () => {
	const canCreateTokens = usePermission('create-personal-access-tokens');

	if (!canCreateTokens) {
		return <NotAuthorizedPage />;
	}

	return <AccountTokensPage />;
};

export default AccountTokensRoute;
