import React, { useMemo, useState } from 'react';

import { usePermission } from '../../../../../client/contexts/AuthorizationContext';
import { useEndpointData } from '../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { NotAuthorizedPage } from '../settings/NotAuthorizedPage';
import { useSwitchTab } from './hooks';
import { UsersAndRoomsTab } from './UsersAndRoomsTab';
import { AdminUsers } from './AdminUsers';
import { useRoute } from '../../../../../client/contexts/RouterContext';
import { useDebounce } from '../../../../ui/client/views/app/components/hooks';

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
}), [params, sort]);

export default function AdminUsersRoute({ props }) {
	const canViewUserAdministration = usePermission('view-user-administration');

	const routeName = 'admin-users';

	const [params, setParams] = useState({});
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebounce(params, 500);

	const query = useQuery(debouncedParams, sort);

	const switchTab = useSwitchTab(routeName);

	const data = useEndpointData('GET', 'users.list', query) || {};

	const router = useRoute(routeName);

	const onClick = (username) => () => router.push({
		context: 'edit',
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
		<AdminUsers setParams={_.debounce(setParams, 300)} onHeaderClick={onHeaderClick} data={data} onClick={onClick} sort={sort}/>
	</UsersAndRoomsTab>;
}
