import { Button, Icon, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useRoute, useRouteParameter, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo, useState, useCallback } from 'react';

import FilterByText from '../../../components/FilterByText';
import { GenericTable } from '../../../components/GenericTable/V2/GenericTable';
import { GenericTableBody } from '../../../components/GenericTable/V2/GenericTableBody';
import { GenericTableHeader } from '../../../components/GenericTable/V2/GenericTableHeader';
import { GenericTableHeaderCell } from '../../../components/GenericTable/V2/GenericTableHeaderCell';
import { GenericTableLoadingTable } from '../../../components/GenericTable/V2/GenericTableLoadingTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AddCustomSound from './AddCustomSound';
import CustomSoundRow from './CustomSoundRow';
import EditCustomSound from './EditCustomSound';

const CustomSoundsRoute = (): ReactElement => {
	const t = useTranslation();
	const id = useRouteParameter('id');
	const route = useRoute('custom-sounds');
	const context = useRouteParameter('context');
	const canManageCustomSounds = usePermission('manage-sounds');

	const { sortBy, sortDirection, setSort } = useSort<'name'>('name');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const [text, setParams] = useState('');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				query: JSON.stringify({ name: { $regex: text || '', $options: 'i' } }),
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[text, itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const { reload, ...result } = useEndpointData('/v1/custom-sounds.list', query);

	const handleItemClick = useCallback(
		(_id) => (): void => {
			route.push({
				context: 'edit',
				id: _id,
			});
		},
		[route],
	);

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
					<FilterByText onChange={({ text }): void => setParams(text)} />
					<GenericTable>
						<GenericTableHeader>
							<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
								{t('Name')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell w='x40' key='action' />
						</GenericTableHeader>
						<GenericTableBody>
							{result.phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={2} />}
							{result.phase === AsyncStatePhase.RESOLVED &&
								result.value.sounds.map((sound) => <CustomSoundRow sound={sound} onClick={handleItemClick} />)}
						</GenericTableBody>
					</GenericTable>
					{result.phase === AsyncStatePhase.RESOLVED && (
						<Pagination
							current={current}
							itemsPerPage={itemsPerPage}
							count={result.value.total || 0}
							onSetItemsPerPage={onSetItemsPerPage}
							onSetCurrent={onSetCurrent}
							{...paginationProps}
						/>
					)}
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar flexShrink={0}>
					<VerticalBar.Header>
						{context === 'edit' && <VerticalBar.Text>{t('Custom_Sound_Edit')}</VerticalBar.Text>}
						{context === 'new' && <VerticalBar.Text>{t('Custom_Sound_Add')}</VerticalBar.Text>}
						<VerticalBar.Close onClick={handleClose} />
					</VerticalBar.Header>
					{context === 'edit' && <EditCustomSound _id={id} close={handleClose} onChange={handleChange} />}
					{context === 'new' && <AddCustomSound goToNew={handleItemClick} close={handleClose} onChange={handleChange} />}
				</VerticalBar>
			)}
		</Page>
	);
};

export default CustomSoundsRoute;
