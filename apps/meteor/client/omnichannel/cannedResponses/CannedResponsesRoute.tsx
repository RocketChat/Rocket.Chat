import { usePermission } from '@rocket.chat/ui-contexts';

import CannedResponsesPage from './CannedResponsesPage';
import NotAuthorizedPage from '../../views/notAuthorized/NotAuthorizedPage';

const CannedResponsesRoute = () => {
	const canViewCannedResponses = usePermission('manage-livechat-canned-responses');

	if (!canViewCannedResponses) {
		return <NotAuthorizedPage />;
	}

	return <CannedResponsesPage />;
};

export default CannedResponsesRoute;
