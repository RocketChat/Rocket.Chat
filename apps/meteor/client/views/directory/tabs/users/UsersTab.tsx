import { usePermission } from '@rocket.chat/ui-contexts';

import UsersTable from './UsersTable';
import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';

type UsersTabProps = {
	workspace?: 'external' | 'local';
};

const UsersTab = (props: UsersTabProps) => {
	const canViewOutsideRoom = usePermission('view-outside-room');
	const canViewDM = usePermission('view-d-room');

	if (canViewOutsideRoom && canViewDM) {
		return <UsersTable {...props} />;
	}

	return <NotAuthorizedPage />;
};

export default UsersTab;
