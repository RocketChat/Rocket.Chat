import React, { useMemo, useState, useCallback, createContext } from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { Page } from '../../components/basic/Page';
import { useEndpointData } from '../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { NotAuthorizedPage } from '../../../app/ui-admin/client/components/NotAuthorizedPage';
import { CustomUserStatus } from './CustomUserStatus';
import { EditCustomUserStatus } from './EditCustomUserStatus';
import { AddCustomUserStatus } from './AddCustomUserStatus';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useDebounce, useMediaQuery } from '../../../app/ui/client/views/app/components/hooks';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = (params, sort, cache) => useMemo(() => ({
	query: JSON.stringify({ name: { $regex: params.text || '', $options: 'i' } }),
	sort: JSON.stringify({ [sort[0]]: sortDir(sort[1]) }),
	...params.itemsPerPage && { count: params.itemsPerPage },
	...params.current && { offset: params.current },
}), [JSON.stringify(params), JSON.stringify(sort), cache]);

export const CurrentStatusContext = createContext();

export default function CustomUserStatusRoute({ props }) {
	const t = useTranslation();
	const canManageUserStatus = usePermission('manage-user-status');

	const routeName = 'custom-user-status';

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);
	const [cache, setCache] = useState();
	const [modal, setModal] = useState();


	/*
	*
	*
	*
	*
	*
	* O GAZZOLIA VAI CRIAR O ENDPOINT PRA ACABAR COM ESSA ZOEIRA
	* \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/ */
	const [currentStatus, setCurrentStatus] = useState({});

	const debouncedParams = useDebounce(params, 500);
	const debouncedSort = useDebounce(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('GET', 'custom-user-status.list', query) || {};

	const router = useRoute(routeName);

	const mobile = useMediaQuery('(max-width: 420px)');
	const small = useMediaQuery('(max-width: 780px)');

	const context = useRouteParameter('context');
	// const id = useRouteParameter('id');

	const onClick = (_id, status) => () => {
		router.push({
			context: 'edit',
			id: _id,
		});
		setCurrentStatus(status);
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
		setCurrentStatus({});
	}, [router]);

	const close = () => {
		router.push({});
	};

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
			&& <Page.VerticalBar mod-small={small} mod-mobile={mobile} style={{ width: '378px' }} qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
				<Page.VerticalBar.Header>
					{ context === 'edit' && t('Custom_User_Status_Edit') }
					{ context === 'new' && t('Custom_User_Status_Add') }
					<Page.VerticalBar.Close onClick={close}/></Page.VerticalBar.Header>
				<Page.VerticalBar.Content>
					<CurrentStatusContext.Provider value={{ currentStatus, setCurrentStatus }}>
						{context === 'edit' && <EditCustomUserStatus close={close} setCache={setCache} setModal={setModal}/>}
						{context === 'new' && <AddCustomUserStatus goToNew={onClick} close={close} setCache={setCache}/>}
					</CurrentStatusContext.Provider>
				</Page.VerticalBar.Content>
			</Page.VerticalBar>}
		{ modal && modal }
	</Page>;
}
