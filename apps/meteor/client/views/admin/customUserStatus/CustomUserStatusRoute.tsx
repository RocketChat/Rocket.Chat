import { Button, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useRoute, useRouteParameter, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useState, useCallback, ReactNode } from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AddCustomUserStatus from './AddCustomUserStatus';
import CustomUserStatus, { paramsType, SortType } from './CustomUserStatus';
import EditCustomUserStatusWithData from './EditCustomUserStatusWithData';

function CustomUserStatusRoute(): ReactNode {
	const route = useRoute('custom-user-status');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const canManageUserStatus = usePermission('manage-user-status');

	const t = useTranslation();

	const [params, setParams] = useState<paramsType>(() => ({ text: '', current: 0, itemsPerPage: 25 }));
	const [sort, setSort] = useState<SortType>(() => ['name', 'asc']);

	const { text, itemsPerPage, current } = useDebouncedValue(params, 500);
	const [column, direction] = useDebouncedValue(sort, 500);
	const query = useMemo(
		() => ({
			query: JSON.stringify({ name: { $regex: text || '', $options: 'i' } }),
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[text, itemsPerPage, current, column, direction],
	);

	const { reload, ...result } = useEndpointData('custom-user-status.list', query);

	const handleItemClick = (id: string) => (): void => {
		route.push({
			context: 'edit',
			id,
		});
	};

	const handleHeaderClick = (id: SortType[0]): void => {
		setSort(([sortBy, sortDirection]) => {
			if (sortBy === id) {
				return [id, sortDirection === 'asc' ? 'desc' : 'asc'];
			}

			return [id, 'asc'];
		});
	};

	const handleNewButtonClick = useCallback(() => {
		route.push({ context: 'new' });
	}, [route]);

	const handleClose = useCallback(() => {
		route.push({});
	}, [route]);

	const handleChange = useCallback(() => {
		reload();
	}, [reload]);

	if (!canManageUserStatus) {
		return <NotAuthorizedPage />;
	}

	if (result.phase === AsyncStatePhase.LOADING || result.phase === AsyncStatePhase.REJECTED) {
		return null;
	}

	return (
		<Page flexDirection='row'>
			<Page name='admin-custom-user-status'>
				<Page.Header title={t('Custom_User_Status')}>
					<Button primary onClick={handleNewButtonClick} aria-label={t('New')}>
						<Icon name='plus' /> {t('New')}
					</Button>
				</Page.Header>
				<Page.Content>
					<CustomUserStatus
						setParams={setParams}
						params={params}
						onHeaderClick={handleHeaderClick}
						data={result.value}
						onClick={handleItemClick}
						sort={sort}
					/>
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar flexShrink={0}>
					<VerticalBar.Header>
						{context === 'edit' && t('Custom_User_Status_Edit')}
						{context === 'new' && t('Custom_User_Status_Add')}
						<VerticalBar.Close onClick={handleClose} />
					</VerticalBar.Header>

					{context === 'edit' && <EditCustomUserStatusWithData _id={id} close={handleClose} onChange={handleChange} />}
					{context === 'new' && <AddCustomUserStatus goToNew={handleItemClick} close={handleClose} onChange={handleChange} />}
				</VerticalBar>
			)}
		</Page>
	);
}

export default CustomUserStatusRoute;
