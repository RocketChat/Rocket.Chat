import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import ChatTable from './ChatTable';
import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';

const ChatTab = (): ReactElement => {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <ChatTable />;
	}

	return <NotAuthorizedPage />;
};

export default ChatTab;
