// eslint-disable

import React, { useMemo, useState, useCallback } from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useTranslation } from '../../contexts/TranslationContext';
import Page from '../../components/basic/Page';
import { AdminSounds } from './AdminSounds';
import { AddCustomSound } from './AddCustomSound';
import { EditCustomSound } from './EditCustomSound';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import VerticalBar from '../../components/basic/VerticalBar';
import NotAuthorizedPage from '../NotAuthorizedPage';

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
					{context === 'edit' && <EditCustomSound _id={id} close={close} onChange={onChange} cache={cache}/>}
					{context === 'new' && <AddCustomSound goToNew={onClick} close={close} onChange={onChange}/>}
				</VerticalBar.Content>
			</VerticalBar>}
	</Page>;
}
