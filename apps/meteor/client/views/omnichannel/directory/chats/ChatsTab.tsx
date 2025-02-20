import { usePermission } from '@rocket.chat/ui-contexts';

import ChatsTable from './ChatsTable';
import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';

const ChatsTab = () => {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <ChatsTable />;
	}

	return <NotAuthorizedPage />;
};

export default ChatsTab;
