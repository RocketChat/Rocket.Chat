import { useRole } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import FederationDashboardPage from './FederationDashboardPage';

const FederationDashboardRoute: FC = () => {
	const authorized = useRole('admin');

	if (!authorized) {
		return <NotAuthorizedPage />;
	}

	return <FederationDashboardPage />;
};

export default FederationDashboardRoute;
