import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useState, useMemo } from 'react';

import { useEndpointData } from '../../../hooks/useEndpointData';
import UsersInRoleTable from './UsersInRoleTable';

const UsersInRoleTableContainer = ({ rid, roleId, roleName, description, reloadRef }) => {
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const debouncedParams = useDebouncedValue(params, 500);

	const query = useMemo(
		() => ({
			roomId: rid,
			role: roleId,
			...(debouncedParams.itemsPerPage && { count: debouncedParams.itemsPerPage }),
			...(debouncedParams.current && { offset: debouncedParams.current }),
		}),
		[debouncedParams, rid, roleId],
	);

	const { value: data = {}, reload } = useEndpointData('roles.getUsersInRole', query);

	reloadRef.current = reload;

	const tableData = data?.users || [];

	return (
		<UsersInRoleTable
			data={tableData}
			total={data?.total}
			reload={reload}
			params={params}
			setParams={setParams}
			roleName={roleName}
			roleId={roleId}
			description={description}
			rid={rid}
		/>
	);
};

export default UsersInRoleTableContainer;
