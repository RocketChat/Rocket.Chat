import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import TriggersPage from './TriggersPage';

const TriggersRoute = () => {
	const canViewTriggers = usePermission('view-livechat-triggers');

	if (!canViewTriggers) {
		return <NotAuthorizedPage />;
	}

	return <TriggersPage />;
};

export default TriggersRoute;
