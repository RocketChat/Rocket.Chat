import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';
import ChatTable from './ChatTable';
import ChatsProvider from './ChatsProvider';

const ChatTab = (): ReactElement => {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return (
			<ChatsProvider>
				<ChatTable />
			</ChatsProvider>
		);
	}

	return <NotAuthorizedPage />;
};

export default ChatTab;
