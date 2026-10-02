import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import ChatsTable from './ChatsTable';

const ChatsTab = () => {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <ChatsTable />;
	}

	return <NotAuthorizedPage />;
};

export default ChatsTab;
