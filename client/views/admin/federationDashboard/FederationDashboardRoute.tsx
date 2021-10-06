import React, { FC } from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { useRole } from '../../../contexts/AuthorizationContext';
import FederationDashboardPage from './FederationDashboardPage';

const FederationDashboardRoute: FC = () => {
	const authorized = useRole('admin');

	if (!authorized) {
		return <NotAuthorizedPage />;
	}

	return <FederationDashboardPage />;
};

export default FederationDashboardRoute;
