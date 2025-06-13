import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import TeamsTable from './TeamsTable';
import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';

const TeamsTab = (): ReactElement => {
	const canViewPublicRooms = usePermission('view-c-room');
	const canViewAllPrivateRooms = usePermission('view-all-p-room');

	if (canViewPublicRooms || canViewAllPrivateRooms) {
		return <TeamsTable />;
	}

	return <NotAuthorizedPage />;
};

export default TeamsTab;
