import type { ReactElement } from 'react';
import React from 'react';

import UsersTable from './UsersTable';

const UserPanelInvites = (): ReactElement => {
	return (
		<>
			<UsersTable reload={reload} />
		</>
	);
};

export default UserPanelInvites;
