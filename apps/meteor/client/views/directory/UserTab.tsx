import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotAuthorizedPage from '../notAuthorized/NotAuthorizedPage';
import UserTable from './UserTable';

function UserTab(props: { workspace?: 'external' | 'local' }): ReactElement {
	const canViewOutsideRoom = usePermission('view-outside-room');
	const canViewDM = usePermission('view-d-room');

	if (canViewOutsideRoom && canViewDM) {
		return <UserTable {...props} />;
	}

	return <NotAuthorizedPage />;
}

export default UserTab;
