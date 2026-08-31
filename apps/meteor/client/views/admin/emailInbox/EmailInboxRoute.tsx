import { usePermission } from '@rocket.chat/ui-contexts';

import EmailInboxPage from './EmailInboxPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const EmailInboxRoute = () => {
	const canViewEmailInbox = usePermission('manage-email-inbox');

	if (!canViewEmailInbox) {
		return <NotAuthorizedPage />;
	}

	return <EmailInboxPage />;
};

export default EmailInboxRoute;
