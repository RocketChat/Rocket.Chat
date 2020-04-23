import React, { useMemo, useState } from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useEndpointData } from '../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { NotAuthorizedPage } from '../../../app/ui-admin/client/components/NotAuthorizedPage';
import { useSwitchTab } from '../usersAndRooms/hooks';
import { UsersAndRoomsTab } from '../usersAndRooms/UsersAndRoomsTab';
import { AdminUsers } from './AdminUsers';
import { useRoute } from '../../contexts/RouterContext';
import { useDebounce } from '../../../app/ui/client/views/app/components/hooks';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = (params, sort) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, emails: 1, roles: 1, status: 1 }),
	query: JSON.stringify({
		$or: [
			{ 'emails.address': { $regex: params.text || '', $options: 'i' } },
			{ username: { $regex: params.text || '', $options: 'i' } },
			{ name: { $regex: params.text || '', $options: 'i' } },
		],
	}),
	sort: JSON.stringify({ [sort[0]]: sortDir(sort[1]), usernames: sort[0] === 'name' ? sortDir(sort[1]) : undefined }),
	...params.itemsPerPage && { count: params.itemsPerPage },
	...params.current && { offset: params.current },
}), [JSON.stringify(params), JSON.stringify(sort)]);

export default function AdminUsersRoute({ props }) {
	const canViewUserAdministration = usePermission('view-user-administration');

	const routeName = 'admin-users';

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebounce(params, 500);
	const debouncedSort = useDebounce(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort);

	const switchTab = useSwitchTab(routeName);

	const data = useEndpointData('GET', 'users.list', query) || {};

	const router = useRoute(routeName);

	const onClick = (username) => () => router.push({
		context: 'info',
		id: username,
	});

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	if (!canViewUserAdministration) {
		return <NotAuthorizedPage />;
	}

	return <UsersAndRoomsTab route={routeName} switchTab={switchTab} tab='users' {...props}>
		<AdminUsers setParams={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onClick={onClick} sort={sort}/>
	</UsersAndRoomsTab>;
}
