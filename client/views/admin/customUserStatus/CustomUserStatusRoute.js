import { Button, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState, useCallback } from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import AddCustomUserStatus from './AddCustomUserStatus';
import CustomUserStatus from './CustomUserStatus';
import EditCustomUserStatusWithData from './EditCustomUserStatusWithData';

function CustomUserStatusRoute() {
	const route = useRoute('custom-user-status');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const canManageUserStatus = usePermission('manage-user-status');

	const t = useTranslation();

	const [params, setParams] = useState(() => ({ text: '', current: 0, itemsPerPage: 25 }));
	const [sort, setSort] = useState(() => ['name', 'asc']);

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

	const { value: data, reload } = useEndpointData('custom-user-status.list', query);

	const handleItemClick = (_id) => () => {
		route.push({
			context: 'edit',
			id: _id,
		});
	};

	const handleHeaderClick = (id) => {
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
						data={data}
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
