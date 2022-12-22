import { Box, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { usePermission, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo, useState } from 'react';

import FilterByText from '../../../components/FilterByText';
import { GenericTableBody, GenericTableHeader, GenericTableHeaderCell, GenericTableLoadingTable } from '../../../components/GenericTable';
import { GenericTable } from '../../../components/GenericTable/V2/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import Page from '../../../components/Page';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AddAgent from './AddAgent';
import AgentsPageRow from './AgentsPageRow';
import AgentsTab from './AgentsTab';
import { useQuery } from './hooks/useQuery';

const AgentsPage = (): ReactElement => {
	const t = useTranslation();
	const canViewAgents = usePermission('manage-livechat-agents');
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const { sortBy, sortDirection, setSort } = useSort<'name' | 'username' | 'emails.address' | 'statusLivechat'>('name');
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 500);
	const debouncedSort = useDebouncedValue(
		useMemo(() => [sortBy, sortDirection], [sortBy, sortDirection]),
		500,
	) as ['name' | 'username' | 'emails.address' | 'statusLivechat', 'asc' | 'desc'];

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const query = useQuery({ text: debouncedFilter, current, itemsPerPage }, debouncedSort);
	const { reload, ...result } = useEndpointData('/v1/livechat/users/agent', query);

	const onHeaderClick = useMutableCallback((id) => {
		if (sortBy === id) {
			setSort(id, sortDirection === 'asc' ? 'desc' : 'asc');
			return;
		}
		setSort(id, 'asc');
	});

	if (!canViewAgents) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Agents')} />
				<AddAgent reload={reload} />
				<Box pi='24px'>
					<FilterByText onChange={({ text }: { text: string }): void => setFilter(text)} />
				</Box>
				<Page.Content>
					<GenericTable>
						<GenericTableHeader>
							<GenericTableHeaderCell direction={sortDirection} sort='name' active={sortBy === 'name'} onClick={onHeaderClick}>
								{t('Name')}
							</GenericTableHeaderCell>
							{mediaQuery && (
								<GenericTableHeaderCell direction={sortDirection} sort='username' active={sortBy === 'username'} onClick={onHeaderClick}>
									{t('Username')}
								</GenericTableHeaderCell>
							)}
							<GenericTableHeaderCell
								direction={sortDirection}
								sort='emails.address'
								active={sortBy === 'emails.address'}
								onClick={onHeaderClick}
							>
								{t('Email')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell
								direction={sortDirection}
								sort='statusLivechat'
								active={sortBy === 'statusLivechat'}
								onClick={onHeaderClick}
							>
								{t('Livechat_status')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell w='x60'>{t('Remove')}</GenericTableHeaderCell>
						</GenericTableHeader>
						<GenericTableBody data-qa='GenericTableAgentInfoBody'>
							{result.phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={4} />}
							{result.phase === AsyncStatePhase.RESOLVED &&
								result.value.users.map((user) => <AgentsPageRow key={user._id} user={user} mediaQuery={mediaQuery} reload={reload} />)}
						</GenericTableBody>
					</GenericTable>
					{result.phase === AsyncStatePhase.RESOLVED && (
						<Pagination
							current={current}
							itemsPerPage={itemsPerPage}
							count={result.value.total}
							onSetItemsPerPage={setItemsPerPage}
							onSetCurrent={setCurrent}
							{...paginationProps}
						/>
					)}
				</Page.Content>
			</Page>
			{context && id && <AgentsTab reload={reload} context={context} id={id} />}
		</Page>
	);
};

export default AgentsPage;
