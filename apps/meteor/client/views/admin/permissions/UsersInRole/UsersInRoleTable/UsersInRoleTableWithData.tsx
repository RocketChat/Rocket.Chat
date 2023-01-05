import type { IRole, IRoom, IUserInRole } from '@rocket.chat/core-typings';
import type { ReactElement, MutableRefObject } from 'react';
import React, { useEffect, useMemo } from 'react';

import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
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

	const { reload, ...result } = useEndpointData('/v1/roles.getUsersInRole', query);

	useEffect(() => {
		reloadRef.current = reload;
	}, [reload, reloadRef]);

	if (result.phase === AsyncStatePhase.LOADING || result.phase === AsyncStatePhase.REJECTED) {
		return null;
	}

	const users: IUserInRole[] = result.value?.users.map((user) => ({
		...user,
		createdAt: new Date(user.createdAt),
		_updatedAt: new Date(user._updatedAt),
	}));

	return (
		<UsersInRoleTable
			users={users}
			total={result.value.total}
			reload={reload}
			roleName={roleName}
			roleId={roleId}
			description={description}
			rid={rid}
			paginationData={{ itemsPerPage, current, ...paginationData }}
		/>
	);
};

export default UsersInRoleTableWithData;
