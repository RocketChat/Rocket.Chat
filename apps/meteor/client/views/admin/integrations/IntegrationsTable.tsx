import { Pagination, States, StatesActions, StatesAction, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useEndpoint, useRoute, useTranslation, useLayout } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback, useState } from 'react';

import IntegrationRow from './IntegrationRow';
import FilterByText from '../../../components/FilterByText';
import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';

const IntegrationsTable = ({ type }: { type?: string }) => {
	const t = useTranslation();
	const { isMobile } = useLayout();

	const [text, setText] = useState('');
	const router = useRoute('admin-integrations');
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'channel' | '_createdBy' | '_createdAt' | 'username'>('name');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const query = useDebouncedValue(
		useMemo(
			() => ({
				name: escapeRegExp(text),
				type,
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: current,
			}),
			[text, itemsPerPage, current, sortBy, sortDirection, type],
		),
		500,
	);

	const getIntegrations = useEndpoint('GET', '/v1/integrations.list');
	const { data, isLoading, isSuccess, isError, refetch } = useQuery({
		queryKey: ['integrations', query],
		queryFn: async () => getIntegrations(query),
	});

	const onClick = useCallback(
		(_id: string, type: string) => () =>
			router.push({
				context: 'edit',
				type: type === 'webhook-incoming' ? 'incoming' : 'outgoing',
				id: _id,
			}),
		[router],
	);

	const headers = (
		<>
			<GenericTableHeaderCell
				key='name'
				direction={sortDirection}
				active={sortBy === 'name'}
				onClick={setSort}
				sort='name'
				{...(!isMobile && { w: 'x280' })}
			>
				{t('Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='channel' direction={sortDirection} active={sortBy === 'channel'} onClick={setSort} sort='channel'>
				{t('Post_to')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='_createdBy'
				direction={sortDirection}
				active={sortBy === '_createdBy'}
				onClick={setSort}
				sort='_createdBy'
			>
				{t('Created_by')}
			</GenericTableHeaderCell>
			{!isMobile && (
				<GenericTableHeaderCell
					key='_createdAt'
					direction={sortDirection}
					active={sortBy === '_createdAt'}
					onClick={setSort}
					sort='_createdAt'
				>
					{t('Created_at')}
				</GenericTableHeaderCell>
			)}
			<GenericTableHeaderCell key='username' direction={sortDirection} active={sortBy === 'username'} onClick={setSort} sort='username'>
				{t('Post_as')}
			</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			<FilterByText placeholder={t('Search_Integrations')} value={text} onChange={(event) => setText(event.target.value)} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={!isMobile ? 5 : 4} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data && data.integrations.length > 0 && (
				<>
					<GenericTable aria-label={t('Integrations_table')}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{isSuccess &&
								data?.integrations.map((integration) => (
									<IntegrationRow key={integration._id} integration={integration} isMobile={isMobile} onClick={onClick} />
								))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{isSuccess && data && data.integrations.length === 0 && <GenericNoResults />}
			{isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesActions>
						<StatesAction onClick={() => refetch()}>{t('Reload_page')}</StatesAction>
					</StatesActions>
				</States>
			)}
		</>
	);
};

export default IntegrationsTable;
