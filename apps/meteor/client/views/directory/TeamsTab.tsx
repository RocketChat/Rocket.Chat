import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

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
