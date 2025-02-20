import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { hashKey } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AddAgent from './AddAgent';
import AgentsTableRow from './AgentsTableRow';
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

// TODO: missing error state
const AgentsTable = () => {
	const { t } = useTranslation();

	const { sortBy, sortDirection, setSort } = useSort<'name' | 'username' | 'emails.address' | 'statusLivechat'>('name');
	const [text, setText] = useState('');
	const debouncedSort = useDebouncedValue(
		useMemo(() => [sortBy, sortDirection], [sortBy, sortDirection]),
		500,
	) as ['name' | 'username' | 'emails.address' | 'statusLivechat', 'asc' | 'desc'];

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const query = useQuery({ text, current, itemsPerPage }, debouncedSort);
	const { data, isSuccess, isLoading, refetch } = useAgentsQuery(query);

	const [defaultQuery] = useState(hashKey([query]));
	const queryHasChanged = defaultQuery !== hashKey([query]);

	const onHeaderClick = useEffectEvent((id: 'name' | 'username' | 'emails.address' | 'statusLivechat') => {
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
			{((isSuccess && data?.users.length > 0) || queryHasChanged) && (
				<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			)}
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
					linkHref='https://go.rocket.chat/i/omnichannel-docs'
					linkText={t('Learn_more_about_agents')}
				/>
			)}
			{isSuccess && data?.users.length > 0 && (
				<>
					<GenericTable aria-busy={isLoading} data-qa-id='agents-table'>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody data-qa='GenericTableAgentInfoBody'>
							{data?.users.map((user) => <AgentsTableRow key={user._id} user={user} mediaQuery={mediaQuery} />)}
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
