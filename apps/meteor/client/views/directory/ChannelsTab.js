import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../notAuthorized/NotAuthorizedPage';
import ChannelsTable from './ChannelsTable';

function ChannelsTab(props) {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <ChannelsTable {...props} />;
	}

	return <NotAuthorizedPage />;
}

export default ChannelsTab;
