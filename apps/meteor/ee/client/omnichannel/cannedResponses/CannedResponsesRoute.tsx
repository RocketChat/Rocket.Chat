import { usePermission } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import NotAuthorizedPage from '../../../../client/views/notAuthorized/NotAuthorizedPage';
import CannedResponsesPage from './CannedResponsesPage';

const CannedResponsesRoute: FC = () => {
	const canViewCannedResponses = usePermission('manage-livechat-canned-responses');

	if (!canViewCannedResponses) {
		return <NotAuthorizedPage />;
	}

	return <CannedResponsesPage />;
};

export default CannedResponsesRoute;
