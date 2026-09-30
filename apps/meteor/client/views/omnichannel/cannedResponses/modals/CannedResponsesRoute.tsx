import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import CannedResponsesPage from './CannedResponsesPage';

const CannedResponsesRoute = () => {
	const canViewCannedResponses = usePermission('manage-livechat-canned-responses');

	if (!canViewCannedResponses) {
		return <NotAuthorizedPage />;
	}

	return <CannedResponsesPage />;
};

export default CannedResponsesRoute;
