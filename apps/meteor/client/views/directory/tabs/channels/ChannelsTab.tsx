import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import ChannelsTable from './ChannelsTable';

const ChannelsTab = () => {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <ChannelsTable />;
	}

	return <NotAuthorizedPage />;
};

export default ChannelsTab;
