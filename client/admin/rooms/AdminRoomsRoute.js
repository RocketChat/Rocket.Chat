import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState } from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { NotAuthorizedPage } from '../../../app/ui-admin/client/components/NotAuthorizedPage';
import { UsersAndRoomsTab } from '../usersAndRooms/UsersAndRoomsTab';
import { useRoute } from '../../contexts/RouterContext';
import { useSwitchTab } from '../usersAndRooms/hooks';
import { roomTypes } from '../../../app/utils/client';
import { AdminRooms, DEFAULT_TYPES } from './AdminRooms';

const useQuery = (params, sort) => useMemo(() => ({
	filter: params.text || '',
	types: params.types,
	sort: JSON.stringify({ [sort[0]]: sort[1] === 'asc' ? 1 : -1 }),
	...params.itemsPerPage && { count: params.itemsPerPage },
	...params.current && { offset: params.current },
}), [JSON.stringify(params), JSON.stringify(sort)]);

export default function AdminRoomsRoute({ props }) {
	const canViewRoomAdministration = usePermission('view-room-administration');

	const [params, setParams] = useState({ text: '', types: DEFAULT_TYPES, current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const routeName = 'admin-rooms';

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort);

	const data = useEndpointData('rooms.adminRooms', query) || {};

	const switchTab = useSwitchTab(routeName);

	const router = useRoute(routeName);

	const onClick = (rid) => () => router.push({
		context: 'edit',
		id: rid,
	});

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	if (sort[0] === 'name' && data.rooms) {
		data.rooms = data.rooms.sort((a, b) => {
			const aName = a.type === 'd' ? a.usernames.join(' x ') : roomTypes.getRoomName(a.t, a);
			const bName = b.type === 'd' ? b.usernames.join(' x ') : roomTypes.getRoomName(b.t, b);
			if (aName === bName) { return 0; }
			const result = aName < bName ? -1 : 1;
			return sort[1] === 'asc' ? result : result * -1;
		});
	}

	if (!canViewRoomAdministration) {
		return <NotAuthorizedPage />;
	}

	return <UsersAndRoomsTab route={routeName} switchTab={switchTab} tab='rooms' {...props}>
		<AdminRooms setParams={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onClick={onClick} sort={sort}/>
	</UsersAndRoomsTab>;
}
