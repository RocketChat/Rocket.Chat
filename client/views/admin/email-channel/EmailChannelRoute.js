import React from 'react';

import { usePermission } from '../../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import EmailChannelPage from './EmailChannelPage';

function EmailChannelRoute() {
	const canViewEmailChannel = usePermission('view-room-administration');

	if (!canViewEmailChannel) {
		return <NotAuthorizedPage />;
	}

	return <EmailChannelPage />;
}

export default EmailChannelRoute;
