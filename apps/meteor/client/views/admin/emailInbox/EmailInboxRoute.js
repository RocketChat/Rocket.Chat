import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EmailInboxPage from './EmailInboxPage';

function EmailInboxRoute() {
	const canViewEmailInbox = usePermission('manage-email-inbox');

	if (!canViewEmailInbox) {
		return <NotAuthorizedPage />;
	}

	return <EmailInboxPage />;
}

export default EmailInboxRoute;
