import React from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { usePermission } from '../../../contexts/AuthorizationContext';
import EmailInboxPage from './EmailInboxPage';

function EmailInboxRoute() {
	const canViewEmailInbox = usePermission('manage-email-inbox');

	if (!canViewEmailInbox) {
		return <NotAuthorizedPage />;
	}

	return <EmailInboxPage />;
}

export default EmailInboxRoute;
