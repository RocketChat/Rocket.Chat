import type { IRole, IRoom, IUserInRole } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, MutableRefObject } from 'react';
import React, { useEffect, useMemo } from 'react';

import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import UsersInRoleTable from './UsersInRoleTable';

type UsersInRoleTableWithDataProps = {
	rid?: IRoom['_id'];
	roleId: IRole['_id'];
	roleName: IRole['name'];
	description: IRole['description'];
	reloadRef: MutableRefObject<() => void>;
};

const UsersInRoleTableWithData = ({
	rid,
	roleId,
	roleName,
	description,
	reloadRef,
}: UsersInRoleTableWithDataProps): ReactElement | null => {
	const { itemsPerPage, current, ...paginationData } = usePagination();

	const query = useMemo(
		() => ({
			role: roleId,
			...(rid && { roomId: rid }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[itemsPerPage, current, rid, roleId],
	);

	const getUsersInRole = useEndpoint('GET', '/v1/roles.getUsersInRole');

	const { refetch, ...result } = useQuery(['roles', roleId, 'users', query], async () => {
		const users = await getUsersInRole(query);
		return users;
	});

	useEffect(() => {
		reloadRef.current = refetch;
	}, [refetch, reloadRef]);

	if (result.isLoading || result.error) {
		return null;
	}

	const users: IUserInRole[] = result.data!.users.map((user) => ({
		...user,
		createdAt: new Date(user.createdAt),
		_updatedAt: new Date(user._updatedAt),
	}));

	return (
		<UsersInRoleTable
			users={users}
			total={result.data!.total}
			reload={refetch}
			roleName={roleName}
			roleId={roleId}
			description={description}
			rid={rid}
			paginationData={{ itemsPerPage, current, ...paginationData }}
		/>
	);
};

export default UsersInRoleTableWithData;
