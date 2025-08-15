import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import ScheduledMessagesPage from './ScheduledMessagesPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const ScheduledMessagesRoute = (): ReactElement => {
	const canViewProfile = useSetting('Accounts_AllowUserProfileChange');

	if (!canViewProfile) {
		return <NotAuthorizedPage />;
	}

	return <ScheduledMessagesPage />;
};

export default ScheduledMessagesRoute;
