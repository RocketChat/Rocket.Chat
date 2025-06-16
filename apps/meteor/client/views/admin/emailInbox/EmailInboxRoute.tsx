import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import EmailInboxPage from './EmailInboxPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const EmailInboxRoute = (): ReactElement => {
	const canViewEmailInbox = usePermission('manage-email-inbox');

	if (!canViewEmailInbox) {
		return <NotAuthorizedPage />;
	}

	return <EmailInboxPage />;
};

export default EmailInboxRoute;
