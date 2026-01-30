import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import UsersTable from './UsersTable';
import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';

const UsersTab = (props: { workspace?: 'external' | 'local' }): ReactElement => {
	const canViewOutsideRoom = usePermission('view-outside-room');
	const canViewDM = usePermission('view-d-room');

	if (canViewOutsideRoom && canViewDM) {
		return <UsersTable {...props} />;
	}

	return <NotAuthorizedPage />;
};

export default UsersTab;
