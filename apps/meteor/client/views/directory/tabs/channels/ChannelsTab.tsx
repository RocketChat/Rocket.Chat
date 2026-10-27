import { usePermission } from '@rocket.chat/ui-contexts';

import ChannelsTable from './ChannelsTable';
import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';

const ChannelsTab = () => {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <ChannelsTable />;
	}

	return <NotAuthorizedPage />;
};

export default ChannelsTab;
