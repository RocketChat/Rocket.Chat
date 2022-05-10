import { usePermission } from '@rocket.chat/ui-contexts';
import React, { ReactElement, SetStateAction, Dispatch } from 'react';

import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';
import ChatTable from './ChatTable';

// TODO Check if I need to type the setstateaction params, if I should do:
// { setChatReload: Dispatch<SetStateAction<(param: () => void) => void>> }
const ChatTab = (props: { setChatReload: Dispatch<SetStateAction<any>> }): ReactElement => {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <ChatTable {...props} />;
	}

	return <NotAuthorizedPage />;
};

export default ChatTab;
