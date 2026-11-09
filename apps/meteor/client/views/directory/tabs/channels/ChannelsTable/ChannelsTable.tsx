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
	usePagination,
	useSort,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useMemo, useState } from 'react';

import ChannelsTableRow from './ChannelsTableRow';
import FilterByText from '../../../../../components/FilterByText';
import { useDirectoryQuery } from '../../../hooks/useDirectoryQuery';

const ChannelsTable = () => {
	const t = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 768px)');
	const [text, setText] = useState('');

	const channelRoute = useRoute('channel');
	const groupsRoute = useRoute('group');

	const { sortBy, sortDirection, setSort } = useSort<'name' | 'usersCount' | 'lastMessage' | 'createdAt'>('name');

	const columns: TableColumnWidth[] = ['auto', '100px', ...(mediaQuery ? (['150px', '150px', '150px'] as const) : [])];

	const headers = useMemo(
		() =>
			[
				<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
					{t('Name')}
				</GenericTableHeaderCell>,
				<GenericTableHeaderCell
					key='usersCount'
					direction={sortDirection}
					active={sortBy === 'usersCount'}
					onClick={setSort}
					sort='usersCount'
				>
					{t('Users')}
				</GenericTableHeaderCell>,
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
				mediaQuery && (
					<GenericTableHeaderCell
						key='lastMessage'
						direction={sortDirection}
						active={sortBy === 'lastMessage'}
						onClick={setSort}
						sort='lastMessage'
					>
						{t('Last_Message')}
					</GenericTableHeaderCell>
				),
				mediaQuery && <GenericTableHeaderCell key='belongsTo'>{t('Belongs_To')}</GenericTableHeaderCell>,
			].filter(Boolean),
		[setSort, sortBy, t, sortDirection, mediaQuery],
	);

	const getDirectoryData = useEndpoint('GET', '/v1/directory');
	const query = useDirectoryQuery({ text }, [sortBy, sortDirection], 'channels');
	const queryKey = ['getDirectoryData', query];
	const {
		current,
		itemsPerPage,
		setItemsPerPage: onSetItemsPerPage,
		setCurrent: onSetCurrent,
		...paginationProps
	} = usePagination({
		resetKey: queryKey,
	});
	const { data, isFetched, isLoading, isError, refetch } = usePaginatedQuery({
		query: {
			queryKey,
			queryFn: (page) => getDirectoryData({ ...query, ...page }),
		},
		itemsKey: 'result',
		offset: current,
		count: itemsPerPage,
	});

	const onClick = useMemo(
		() => (name: IRoom['name'], type: IRoom['t']) => (e: KeyboardEvent | MouseEvent) => {
			if (name && (e.type === 'click' || (e as KeyboardEvent).key === 'Enter')) {
				type === 'c' ? channelRoute.push({ name }) : groupsRoute.push({ name });
			}
		},
		[channelRoute, groupsRoute],
	);

	return (
		<>
			<FilterByText placeholder={t('Search_Channels')} value={text} onChange={(event) => setText(event.target.value)} />
			{isLoading && (
				<GenericTable columns={columns}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={columns.length} />
					</GenericTableBody>
				</GenericTable>
			)}
			{data?.result && data.result.length > 0 && isFetched && (
				<>
					<GenericTable columns={columns}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.result.map((room) => (
								<ChannelsTableRow key={room._id} room={room as Serialized<IRoom>} onClick={onClick} mediaQuery={mediaQuery} />
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

export default ChannelsTable;
