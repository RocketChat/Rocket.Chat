import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import MailerPage from './MailerPage';

const MailerRoute = () => {
	const canAccessMailer = usePermission('access-mailer');

	if (!canAccessMailer) {
		return <NotAuthorizedPage />;
	}

	return <MailerPage />;
};

export default MailerRoute;
