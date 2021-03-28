import React from 'react';

import { useRouteParameter } from '../../../contexts/RouterContext';
import UsersInRolePage from './UsersInRolePage';
import { useRole } from './useRole';

const UsersInRolePageContainer = () => {
	const _id = useRouteParameter('_id');

	const role = useRole(_id);

	if (!role) {
		return null;
	}

	return <UsersInRolePage data={role} />;
};

export default UsersInRolePageContainer;
