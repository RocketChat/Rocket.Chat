import React, { useMemo, useState, useCallback } from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import Page from '../../../../client/components/basic/Page';
import { AdminSounds } from './AdminSounds';
import { NewSound } from './NewSound';
import { EditSound } from './EditSound';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { NotAuthorizedPage } from '../../../../client/admin/NotAuthorizedPage';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

export const useQuery = (params, sort, cache) => useMemo(() => ({
	query: JSON.stringify({ name: { $regex: params.text || '', $options: 'i' } }),
	sort: JSON.stringify({ [sort[0]]: sortDir(sort[1]) }),
	...params.itemsPerPage && { count: params.itemsPerPage },
	...params.current && { offset: params.current },
}), [JSON.stringify(params), JSON.stringify(sort), cache]);

export default function CustomSoundsRoute({ props }) {
	const t = useTranslation();
	const canManageCustomSounds = usePermission('manage-sounds');

	const routeName = 'custom-sounds';

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);
	const [cache, setCache] = useState();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('custom-sounds.list', query) || {};


	const router = useRoute(routeName);

	const mobile = useMediaQuery('(max-width: 420px)');
	const small = useMediaQuery('(max-width: 780px)');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const onClick = (_id) => () => {
		router.push({
			context: 'edit',
			id: _id,
		});
	};

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	const handleHeaderButtonClick = useCallback((context) => () => {
		router.push({ context });
	}, [router]);

	const close = () => {
		router.push({});
	};

	if (!canManageCustomSounds) {
		return <NotAuthorizedPage />;
	}

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	return <Page {...props} flexDirection='row'>
		<Page name='admin-custom-sounds'>
			<Page.Header title={t('Custom_Sounds')}>
				<Button small onClick={handleHeaderButtonClick('new')} aria-label={t('New')}>
					<Icon name='plus'/>
				</Button>
			</Page.Header>
			<Page.Content>
				<AdminSounds setParams={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onClick={onClick} sort={sort}/>
			</Page.Content>
		</Page>
		{ context
			&& <VerticalBar mod-small={small} mod-mobile={mobile} style={{ width: '378px' }} qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
				<VerticalBar.Header>
					{ context === 'edit' && t('Custom_Sound_Edit') }
					{ context === 'new' && t('Custom_Sound_Add') }
					<VerticalBar.Close onClick={close}/></VerticalBar.Header>
				<VerticalBar.Content>
					{context === 'edit' && <EditSound _id={id} close={close} onChange={onChange} cache={cache}/>}
					{context === 'new' && <NewSound goToNew={onClick} close={close} onChange={onChange}/>}
				</VerticalBar.Content>
			</VerticalBar>}
	</Page>;
}




















// import React, { useState } from 'react';
// // import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';


// import { AdminSounds } from './AdminSounds';
// import { usePermission } from '../../../../client/contexts/AuthorizationContext';
// import { NotAuthorizedPage } from '../../../../client/admin/NotAuthorizedPage';
// // import { useEndpointData } from '../../../../client/hooks/useEndpointData';
// import { useRoute } from '../../../../client/contexts/RouterContext';


// export default function CustomSoundsRoute() {
// 	const canAccessCustomSounds = usePermission('manage-sounds');

// 	const routeName = 'custom-sounds';

// 	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
// 	const [sort, setSort] = useState(['name', 'asc']);

// 	const router = useRoute(routeName);

// 	const onClick = (_id) => () => router.push({
// 		context: 'edit',
// 		id: _id,
// 	});

// 	const onHeaderClick = (id) => {
// 		const [sortBy, sortDirection] = sort;

// 		if (sortBy === id) {
// 			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
// 			return;
// 		}
// 		setSort([id, 'asc']);
// 	};


// 	if (!canAccessCustomSounds) {
// 		return <NotAuthorizedPage/>;
// 	}

// 	console.log('Router');

// 	return <AdminSounds route={routeName} setParams={setParams} params={params} onHeaderClick={onHeaderClick} onClick={onClick} sort={sort} />;
// }
