import React from 'react';

import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { usePermission } from '../../contexts/AuthorizationContext';
import ChannelsTable from './ChannelsTable';

function ChannelsTab(props) {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <ChannelsTable {...props} />;
	}

	return <NotAuthorizedPage />;
}

export default ChannelsTab;
