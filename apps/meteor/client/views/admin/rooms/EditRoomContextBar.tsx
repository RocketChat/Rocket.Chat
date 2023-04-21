import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditRoomWithData from './EditRoomWithData';

const EditRoomContextBar = ({ rid, onReload }: { rid: string | undefined; onReload: () => void }): ReactElement => {
	const canViewRoomAdministration = usePermission('view-room-administration');
	return canViewRoomAdministration ? <EditRoomWithData rid={rid} onReload={onReload} /> : <NotAuthorizedPage />;
};

export default EditRoomContextBar;
