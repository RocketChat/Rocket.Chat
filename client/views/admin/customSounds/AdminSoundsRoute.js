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
import AddCustomSound from './AddCustomSound';
import AdminSounds from './AdminSounds';
import EditCustomSound from './EditCustomSound';

function CustomSoundsRoute() {
	const route = useRoute('custom-sounds');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const canManageCustomSounds = usePermission('manage-sounds');

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

	const { value: data, reload } = useEndpointData('custom-sounds.list', query);

	const handleItemClick = useCallback(
		(_id) => () => {
			route.push({
				context: 'edit',
				id: _id,
			});
		},
		[route],
	);

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

	if (!canManageCustomSounds) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page name='admin-custom-sounds'>
				<Page.Header title={t('Custom_Sounds')}>
					<Button primary onClick={handleNewButtonClick} aria-label={t('New')}>
						<Icon name='plus' /> {t('New')}
					</Button>
				</Page.Header>
				<Page.Content>
					<AdminSounds
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
						{context === 'edit' && t('Custom_Sound_Edit')}
						{context === 'new' && t('Custom_Sound_Add')}
						<VerticalBar.Close onClick={handleClose} />
					</VerticalBar.Header>
					{context === 'edit' && <EditCustomSound _id={id} close={handleClose} onChange={handleChange} />}
					{context === 'new' && <AddCustomSound goToNew={handleItemClick} close={handleClose} onChange={handleChange} />}
				</VerticalBar>
			)}
		</Page>
	);
}

export default CustomSoundsRoute;
