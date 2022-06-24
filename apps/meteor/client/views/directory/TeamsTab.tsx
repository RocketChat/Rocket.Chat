import { usePermission } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import NotAuthorizedPage from '../notAuthorized/NotAuthorizedPage';
import TeamsTable from './TeamsTable';

function TeamsTab(): ReactElement {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <TeamsTable />;
	}

	return <NotAuthorizedPage />;
}

export default TeamsTab;
