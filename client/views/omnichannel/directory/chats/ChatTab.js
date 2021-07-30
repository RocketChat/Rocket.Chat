import React from 'react';

import NotAuthorizedPage from '../../../../components/NotAuthorizedPage';
import { usePermission } from '../../../../contexts/AuthorizationContext';
import ChatTable from './ChatTable';

function ChatTab(props) {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <ChatTable {...props} />;
	}

	return <NotAuthorizedPage />;
}

export default ChatTab;
