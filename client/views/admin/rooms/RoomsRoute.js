import React from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { usePermission } from '../../../contexts/AuthorizationContext';
import RoomsPage from './RoomsPage';

function RoomsRoute() {
	const canViewRoomAdministration = usePermission('view-room-administration');

	if (!canViewRoomAdministration) {
		return <NotAuthorizedPage />;
	}

	return <RoomsPage />;
}

export default RoomsRoute;
