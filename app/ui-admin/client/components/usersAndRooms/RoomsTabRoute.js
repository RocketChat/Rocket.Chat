import React, { useMemo, useState } from 'react';

import { RoomsTab } from './RoomsTab';
import { useRoute } from '../../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';

import { UsersAndRooms } from '.';

const useQuery = (params, sort) => useMemo(() => ({
	query: JSON.stringify({
		filter: params.term,
		types: ['c', 'p', 'd'],
	}),
	sort: JSON.stringify({ [sort[0]]: sort[1] === 'asc' ? 1 : 0 }),
	...params.itemsPerPage && { count: params.itemsPerPage },
	...params.current && { offset: params.current },
}), [params, sort]);


export default function RoomsTabRoute({ props }) {
	const [params, setParams] = useState({});
	const [sort, setSort] = useState(['name', 'asc']);

	const query = useQuery(params, sort);

	const go = useRoute('direct');

	const data = useEndpointData('GET', 'rooms.adminRooms', query) || {};

	const onClick = useMemo(() => (username) => (e) => {
		if (e.type === 'click' || e.key === 'Enter') {
			go({ rid: username });
		}
	}, []);

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	console.log(JSON.stringify(props));
	return <UsersAndRooms tab='rooms'>
		<RoomsTab setParams={setParams} onHeaderClick={onHeaderClick} data={data} onClick={onClick} sort={sort}/>
	</UsersAndRooms>;
}
