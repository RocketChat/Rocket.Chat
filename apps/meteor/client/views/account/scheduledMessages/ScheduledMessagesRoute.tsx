
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';


import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import ScheduledMessagesPage from './ScheduledMessagesPage';

const ScheduledMessagesRoute = (): ReactElement => {
	const canViewProfile = useSetting('Accounts_AllowUserProfileChange');

	if (!canViewProfile) {
		return <NotAuthorizedPage />;
	}

	return <ScheduledMessagesPage />;
};

export default ScheduledMessagesRoute;
