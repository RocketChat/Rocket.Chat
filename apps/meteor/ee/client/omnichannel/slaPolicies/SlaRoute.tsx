import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../../../client/views/notAuthorized/NotAuthorizedPage';
import SlaPage from './SlaPage';

const SlaRoute = () => {
	const canViewSlas = usePermission('manage-livechat-sla');

	if (!canViewSlas) {
		return <NotAuthorizedPage />;
	}

	return <SlaPage />;
};

export default SlaRoute;
