import React from 'react';

import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { usePermission } from '../../contexts/AuthorizationContext';
import TrendingTable from './TrendingTable';

function TrendingTab(props) {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <TrendingTable {...props} />;
	}

	return <NotAuthorizedPage />;
}

export default TrendingTab;
