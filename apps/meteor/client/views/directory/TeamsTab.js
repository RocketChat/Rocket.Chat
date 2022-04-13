import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../notAuthorized/NotAuthorizedPage';
import TeamsTable from './TeamsTable';

function TeamsTab(props) {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <TeamsTable {...props} />;
	}

	return <NotAuthorizedPage />;
}

export default TeamsTab;
