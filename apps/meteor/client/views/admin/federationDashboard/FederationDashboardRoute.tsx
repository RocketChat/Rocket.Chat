import { useRole } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

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
