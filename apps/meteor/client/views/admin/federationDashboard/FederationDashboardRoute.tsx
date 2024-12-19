import { useRole } from '@rocket.chat/ui-contexts';
import React from 'react';

import FederationDashboardPage from './FederationDashboardPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const FederationDashboardRoute = () => {
	const authorized = useRole('admin');

	if (!authorized) {
		return <NotAuthorizedPage />;
	}

	return <FederationDashboardPage />;
};

export default FederationDashboardRoute;
