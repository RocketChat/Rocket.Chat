import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { hashQueryKey } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import React, { useMemo, useState, useEffect } from 'react';

import FilterByText from '../../../../components/FilterByText';
import GenericNoResults from '../../../../components/GenericNoResults/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import { useAgentsQuery } from '../hooks/useAgentsQuery';
import { useQuery } from '../hooks/useQuery';
import AddAgent from './AddAgent';
import AgentsTableRow from './AgentsTableRow';

// TODO: missing error state
const AgentsTable = ({ reload }: { reload: MutableRefObject<() => void> }) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');

	const { sortBy, sortDirection, setSort } = useSort<'name' | 'username' | 'emails.address' | 'statusLivechat'>('name');
	const debouncedFilter = useDebouncedValue(filter, 500);
	const debouncedSort = useDebouncedValue(
		useMemo(() => [sortBy, sortDirection], [sortBy, sortDirection]),
		500,
	) as ['name' | 'username' | 'emails.address' | 'statusLivechat', 'asc' | 'desc'];

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const query = useQuery({ text: debouncedFilter, current, itemsPerPage }, debouncedSort);
	const { data, isSuccess, isLoading, refetch } = useAgentsQuery(query);

	const [defaultQuery] = useState(hashQueryKey([query]));
	const queryHasChanged = defaultQuery !== hashQueryKey([query]);

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);
	reload.current = refetch;

	const onHeaderClick = useMutableCallback((id) => {
		if (sortBy === id) {
			setSort(id, sortDirection === 'asc' ? 'desc' : 'asc');
			return;
		}
		setSort(id, 'asc');
	});

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const headers = (
		<>
			<GenericTableHeaderCell direction={sortDirection} sort='name' active={sortBy === 'name'} onClick={onHeaderClick}>
				{t('Name')}
			</GenericTableHeaderCell>
			{mediaQuery && (
				<GenericTableHeaderCell direction={sortDirection} sort='username' active={sortBy === 'username'} onClick={onHeaderClick}>
					{t('Username')}
				</GenericTableHeaderCell>
			)}
			<GenericTableHeaderCell direction={sortDirection} sort='emails.address' active={sortBy === 'emails.address'} onClick={onHeaderClick}>
				{t('Email')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell direction={sortDirection} sort='statusLivechat' active={sortBy === 'statusLivechat'} onClick={onHeaderClick}>
				{t('Livechat_status')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell w='x60'>{t('Remove')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			<AddAgent reload={refetch} />
			{((isSuccess && data?.users.length > 0) || queryHasChanged) && <FilterByText onChange={({ text }) => setFilter(text)} />}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={mediaQuery ? 4 : 3} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.users.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data.users.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='headset'
					title={t('No_agents_yet')}
					description={t('No_agents_yet_description')}
					linkHref='https://go.rocket.chat/omnichannel-docs'
					linkText={t('Learn_more_about_agents')}
				/>
			)}
			{isSuccess && data?.users.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody data-qa='GenericTableAgentInfoBody'>
							{data?.users.map((user) => (
								<AgentsTableRow key={user._id} user={user} mediaQuery={mediaQuery} reload={refetch} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</>
	);
};

export default AgentsTable;
