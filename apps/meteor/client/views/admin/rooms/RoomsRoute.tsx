import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import RoomsPage from './RoomsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const RoomsRoute = (): ReactElement => {
	const canViewRoomAdministration = usePermission('view-room-administration');

	if (!canViewRoomAdministration) {
		return <NotAuthorizedPage />;
	}

	return <RoomsPage />;
};

export default RoomsRoute;
