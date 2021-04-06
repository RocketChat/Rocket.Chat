import React from 'react';

import { usePermission } from '../../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import InformationPage from './InformationPage';


function InformationRoute() {
	const canViewStatistics = usePermission('view-statistics');

	if (!canViewStatistics) {
		return <NotAuthorizedPage />;
	}

	return <InformationPage />;
}

export default InformationRoute;
