import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import TriggersPage from './TriggersPage';

const TriggersRoute = () => {
	const canViewTriggers = usePermission('view-livechat-triggers');

	if (!canViewTriggers) {
		return <NotAuthorizedPage />;
	}

	return <TriggersPage />;
};

export default TriggersRoute;
