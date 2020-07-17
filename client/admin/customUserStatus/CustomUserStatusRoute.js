import React, { useMemo, useState, useCallback } from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useTranslation } from '../../contexts/TranslationContext';
import Page from '../../components/basic/Page';
import { CustomUserStatus } from './CustomUserStatus';
import { EditCustomUserStatusWithData } from './EditCustomUserStatus';
import { AddCustomUserStatus } from './AddCustomUserStatus';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import VerticalBar from '../../components/basic/VerticalBar';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

export const useQuery = ({ text, itemsPerPage, current }, [column, direction], cache) => useMemo(() => ({
	query: JSON.stringify({ name: { $regex: text || '', $options: 'i' } }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
	// TODO: remove cache. Is necessary for data invalidation
}), [text, itemsPerPage, current, column, direction, cache]);

export default function CustomUserStatusRoute({ props }) {
	const t = useTranslation();
	const canManageUserStatus = usePermission('manage-user-status');

	const routeName = 'custom-user-status';

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);
	const [cache, setCache] = useState();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('custom-user-status.list', query) || {};

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

	const close = useCallback(() => {
		router.push({});
	}, [router]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	if (!canManageUserStatus) {
		return <NotAuthorizedPage />;
	}

	return <Page {...props} flexDirection='row'>
		<Page name='admin-custom-user-status'>
			<Page.Header title={t('Custom_User_Status')}>
				<Button small onClick={handleHeaderButtonClick('new')} aria-label={t('New')}>
					<Icon name='plus'/>
				</Button>
			</Page.Header>
			<Page.Content>
				<CustomUserStatus setParams={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onClick={onClick} sort={sort}/>
			</Page.Content>
		</Page>
		{ context
			&& <VerticalBar mod-small={small} mod-mobile={mobile} style={{ width: '378px' }} qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
				<VerticalBar.Header>
					{ context === 'edit' && t('Custom_User_Status_Edit') }
					{ context === 'new' && t('Custom_User_Status_Add') }
					<VerticalBar.Close onClick={close}/></VerticalBar.Header>
				<VerticalBar.Content>
					{context === 'edit' && <EditCustomUserStatusWithData _id={id} close={close} onChange={onChange} cache={cache}/>}
					{context === 'new' && <AddCustomUserStatus goToNew={onClick} close={close} onChange={onChange}/>}
				</VerticalBar.Content>
			</VerticalBar>}
	</Page>;
}
