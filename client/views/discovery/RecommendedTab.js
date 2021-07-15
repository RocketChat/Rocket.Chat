import React from 'react';

import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { usePermission } from '../../contexts/AuthorizationContext';
import RecommendedTable from './RecommendedTable';

function RecommendedTab(props) {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <RecommendedTable {...props} />;
	}

	return <NotAuthorizedPage />;
}

export default RecommendedTab;
