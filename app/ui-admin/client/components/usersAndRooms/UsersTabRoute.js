import React, { useMemo, useState } from 'react';
import _ from 'underscore';

import { usePermission } from '../../../../../client/contexts/AuthorizationContext';
import { useEndpointData } from '../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { NotAuthorizedPage } from '../settings/NotAuthorizedPage';
import { useSwitchTab } from './hooks';
import { UsersAndRoomsTab } from './UsersAndRoomsTab';
import { UsersTab } from './UsersTab';
import { useRoute } from '../../../../../client/contexts/RouterContext';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = (params, sort) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, emails: 1, roles: 1, status: 1 }),
	query: JSON.stringify({
		$or: [
			{ 'emails.address': { $regex: params.term || '', $options: 'i' } },
			{ username: { $regex: params.term || '', $options: 'i' } },
			{ name: { $regex: params.term || '', $options: 'i' } },
		],
	}),
	sort: JSON.stringify({ [sort[0]]: sortDir(sort[1]), usernames: sort[0] === 'name' ? sortDir(sort[1]) : undefined }),
	...params.itemsPerPage && { count: params.itemsPerPage },
	...params.current && { offset: params.current },
}), [params, sort]);

export default function UsersTabRoute({ props }) {
	const canViewUserAdministration = usePermission('view-user-administration');

	const routeName = 'admin-users';

	const [params, setParams] = useState({});
	const [sort, setSort] = useState(['name', 'asc']);

	const query = useQuery(params, sort);

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
		<UsersTab setParams={_.debounce(setParams, 300)} onHeaderClick={onHeaderClick} data={data} onClick={onClick} sort={sort}/>
	</UsersAndRoomsTab>;
}
