import React from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { usePermission } from '../../../contexts/AuthorizationContext';
import EditRoomWithData from './EditRoomWithData';

function EditRoomContextBar({ rid }) {
	const canViewRoomAdministration = usePermission('view-room-administration');
	return canViewRoomAdministration ? <EditRoomWithData rid={rid} /> : <NotAuthorizedPage />;
}

export default EditRoomContextBar;
