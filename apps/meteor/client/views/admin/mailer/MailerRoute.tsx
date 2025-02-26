import { usePermission } from '@rocket.chat/ui-contexts';

import MailerPage from './MailerPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const MailerRoute = () => {
	const canAccessMailer = usePermission('access-mailer');

	if (!canAccessMailer) {
		return <NotAuthorizedPage />;
	}

	return <MailerPage />;
};

export default MailerRoute;
