import React from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { usePermission } from '../../../contexts/AuthorizationContext';
import EditRoomWithData from './EditRoomWithData';

function EditRoomContextBar({ rid, onReload }) {
	const canViewRoomAdministration = usePermission('view-room-administration');
	return canViewRoomAdministration ? <EditRoomWithData rid={rid} onReload={onReload} /> : <NotAuthorizedPage />;
}

export default EditRoomContextBar;
