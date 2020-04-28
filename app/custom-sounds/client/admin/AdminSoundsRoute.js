import React, { useState } from 'react';
// import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';


import { AdminSounds } from './AdminSounds';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import { NotAuthorizedPage } from '../../../ui-admin/client/components/NotAuthorizedPage';
// import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useRoute } from '../../../../client/contexts/RouterContext';


export default function CustomSoundsRoute() {
	const canAccessCustomSounds = usePermission('manage-sounds');

	const routeName = 'custom-sounds';

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

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


	if (!canAccessCustomSounds) {
		return <NotAuthorizedPage/>;
	}

	console.log('Router');

	return <AdminSounds route={routeName} setParams={setParams} params={params} onHeaderClick={onHeaderClick} onClick={onClick} sort={sort} />;
}
