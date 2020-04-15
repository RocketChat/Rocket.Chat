import React, { useMemo, useState } from 'react';
import _ from 'underscore';

import { usePermission } from '../../../../../client/contexts/AuthorizationContext';
import { useEndpointData } from '../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { NotAuthorizedPage } from '../settings/NotAuthorizedPage';

import { UsersAndRooms, UsersTab, useSwitchTab } from '.';

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

export default function RoomsTabRoute({ props }) {
	const canViewUserAdministration = usePermission('view-user-administration');

	const [params, setParams] = useState({});
	const [sort, setSort] = useState(['name', 'asc']);

	const query = useQuery(params, sort);

	const switchTab = useSwitchTab();

	const data = useEndpointData('GET', 'users.list', query) || {};

	const onClick = () => {};

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	return canViewUserAdministration ? <UsersAndRooms switchTab={switchTab} tab='users' {...props}>
		<UsersTab setParams={_.debounce(setParams, 300)} onHeaderClick={onHeaderClick} data={data} onClick={onClick} sort={sort}/>
	</UsersAndRooms>
		: <NotAuthorizedPage />;
}
