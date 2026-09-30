import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import RoomsPage from './RoomsPage';

const RoomsRoute = () => {
	const canViewRoomAdministration = usePermission('view-room-administration');

	if (!canViewRoomAdministration) {
		return <NotAuthorizedPage />;
	}

	return <RoomsPage />;
};

export default RoomsRoute;
