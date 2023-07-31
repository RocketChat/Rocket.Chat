import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import RegisterWorkspace from './RegisterWorkspace';

const CloudRoute = () => {
	const canManageCloud = usePermission('manage-cloud');

	if (!canManageCloud) {
		return <NotAuthorizedPage />;
	}

	return <RegisterWorkspace />;
};

export default CloudRoute;
