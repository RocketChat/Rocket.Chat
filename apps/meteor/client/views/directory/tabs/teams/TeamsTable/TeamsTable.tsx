import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction, type TableColumnWidth } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
	usePaginatedQuery,
	useSort,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useMemo, useState } from 'react';

import TeamsTableRow from './TeamsTableRow';
import FilterByText from '../../../../../components/FilterByText';
import { useDirectoryQuery } from '../../../hooks/useDirectoryQuery';

const TeamsTable = () => {
	const t = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 768px)');
	const [text, setText] = useState('');

	const { sortBy, sortDirection, setSort } = useSort<'name' | 'usersCount' | 'lastMessage' | 'createdAt'>('name');

	const columns: TableColumnWidth[] = ['auto', '100px', ...(mediaQuery ? (['150px'] as const) : [])];

	const headers = useMemo(
		() =>
			[
				<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
					{t('Name')}
				</GenericTableHeaderCell>,
				<GenericTableHeaderCell key='channelsCount'>{t('Channels')}</GenericTableHeaderCell>,
				mediaQuery && (
					<GenericTableHeaderCell
						key='createdAt'
						direction={sortDirection}
						active={sortBy === 'createdAt'}
						onClick={setSort}
						sort='createdAt'
					>
						{t('Created_at')}
					</GenericTableHeaderCell>
				),
			].filter(Boolean),
		[setSort, sortBy, sortDirection, t, mediaQuery],
	);

	const channelsRoute = useRoute('channel');
	const groupsRoute = useRoute('group');

	const getDirectoryData = useEndpoint('GET', '/v1/directory');
	const query = useDirectoryQuery({ text }, [sortBy, sortDirection], 'teams');
	const { data, isFetched, isLoading, isError, refetch, paginationProps } = usePaginatedQuery({
		query,
		queryKey: ['getDirectoryData', query],
		queryFn: getDirectoryData,
		itemsKey: 'result',
	});

	const onClick = useMemo(
		() => (name: IRoom['name'], type: IRoom['t']) => (e: KeyboardEvent | MouseEvent) => {
			if (name && (e.type === 'click' || (e as KeyboardEvent).key === 'Enter')) {
				type === 'c' ? channelsRoute.push({ name }) : groupsRoute.push({ name });
			}
		},
		[channelsRoute, groupsRoute],
	);

	return (
		<>
			<FilterByText placeholder={t('Teams_Search_teams')} value={text} onChange={(event) => setText(event.target.value)} />
			{isLoading && (
				<GenericTable columns={columns}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={3} />
					</GenericTableBody>
				</GenericTable>
			)}
			{data?.result && data.result.length > 0 && isFetched && (
				<>
					<GenericTable columns={columns}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.result.map((team) => (
								<TeamsTableRow
									key={team._id}
									team={team as unknown as Serialized<IRoom> & { roomsCount: number }}
									onClick={onClick}
									mediaQuery={mediaQuery}
								/>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination divider {...paginationProps} />
				</>
			)}
			{isFetched && data?.result.length === 0 && <GenericNoResults />}
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

export default TeamsTable;
