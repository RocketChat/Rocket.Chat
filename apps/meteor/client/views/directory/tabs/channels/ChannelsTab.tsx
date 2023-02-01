import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';
import ChannelsTable from './ChannelsTable';

const ChannelsTab = (): ReactElement => {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <ChannelsTable />;
	}

	return <NotAuthorizedPage />;
};

export default ChannelsTab;
