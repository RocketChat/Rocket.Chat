import { usePermission } from '@rocket.chat/ui-contexts';

import RoomsPage from './RoomsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const RoomsRoute = () => {
	const canViewRoomAdministration = usePermission('view-room-administration');

	if (!canViewRoomAdministration) {
		return <NotAuthorizedPage />;
	}

	return <RoomsPage />;
};

export default RoomsRoute;
