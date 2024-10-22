import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';
import ChatTable from './ChatTable';

const ChatTab = () => {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <ChatTable />;
	}

	return <NotAuthorizedPage />;
};

export default ChatTab;
