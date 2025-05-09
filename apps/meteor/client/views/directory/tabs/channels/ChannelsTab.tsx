import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import ChannelsTable from './ChannelsTable';
import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';

const ChannelsTab = (): ReactElement => {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <ChannelsTable />;
	}

	return <NotAuthorizedPage />;
};

export default ChannelsTab;
