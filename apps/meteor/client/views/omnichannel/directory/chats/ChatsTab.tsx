import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';
import ChatsTable from './ChatsTable';

const ChatsTab = () => {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <ChatsTable />;
	}

	return <NotAuthorizedPage />;
};

export default ChatsTab;
