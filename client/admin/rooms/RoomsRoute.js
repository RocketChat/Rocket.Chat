import React from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../NotAuthorizedPage';
import RoomsPage from './RoomsPage';

function RoomsRoute() {
	const canViewRoomAdministration = usePermission('view-room-administration');

	if (!canViewRoomAdministration) {
		return <NotAuthorizedPage />;
	}

	return <RoomsPage />;
}

export default RoomsRoute;
