import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../views/notAuthorized/NotAuthorizedPage';
import CannedResponsesPage from './CannedResponsesPage';

const CannedResponsesRoute = () => {
	const canViewCannedResponses = usePermission('manage-livechat-canned-responses');

	if (!canViewCannedResponses) {
		return <NotAuthorizedPage />;
	}

	return <CannedResponsesPage />;
};

export default CannedResponsesRoute;
