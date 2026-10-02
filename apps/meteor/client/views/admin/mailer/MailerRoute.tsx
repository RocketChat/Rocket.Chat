import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import MailerPage from './MailerPage';

const MailerRoute = () => {
	const canAccessMailer = usePermission('access-mailer');

	if (!canAccessMailer) {
		return <NotAuthorizedPage />;
	}

	return <MailerPage />;
};

export default MailerRoute;
