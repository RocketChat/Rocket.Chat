import { Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction, type TableColumnWidth } from '@rocket.chat/fuselage';
import { useMediaQuery, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { OptionProp } from '@rocket.chat/ui-client';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	usePaginatedQuery,
	usePagination,
	useSort,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import RoomRow from './RoomRow';
import RoomsTableFilters from './RoomsTableFilters';
import { roomsQueryKeys } from '../../../lib/queryKeys';

type RoomFilters = {
	searchText: string;
	types: OptionProp[];
};

const DEFAULT_TYPES = ['d', 'p', 'c', 'l', 'discussions', 'teams'];

const RoomsTable = () => {
	const { t } = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const [roomFilters, setRoomFilters] = useState<RoomFilters>({ searchText: '', types: [] });

	const { sortBy, sortDirection, setSort } = useSort<'name' | 't' | 'usersCount' | 'msgs' | 'default' | 'featured' | 'ts'>('name');
	const searchText = useDebouncedValue(roomFilters.searchText, 500);

	const query = useDebouncedValue(
		useMemo(
			() => ({
				filter: searchText || '',
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				types: (roomFilters.types.length ? [...roomFilters.types.map((roomType) => roomType.id)] : DEFAULT_TYPES) as unknown as (
					'c' | 'd' | 'p' | 'l' | 'discussions' | 'teams'
				)[],
			}),
			[searchText, sortBy, sortDirection, roomFilters.types],
		),
		500,
	);

	const queryKey = roomsQueryKeys.adminList(query);
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination({ resetKey: queryKey });

	const getAdminRooms = useEndpoint('GET', '/v1/rooms.adminRooms');

	const { data, refetch, isSuccess, isLoading, isError } = usePaginatedQuery({
		query,
		queryKey,
		queryFn: getAdminRooms,
		itemsKey: 'rooms',
		offset: current,
		count: itemsPerPage,
	});

	const columns: TableColumnWidth[] = ['x200', 'x100', 'x80', ...(mediaQuery ? (['x80', 'x80', 'x80', 'x120'] as const) : [])];

	const headers = (
		<>
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='type' direction={sortDirection} active={sortBy === 't'} onClick={setSort} sort='t'>
				{t('Type')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='users' direction={sortDirection} active={sortBy === 'usersCount'} onClick={setSort} sort='usersCount'>
				{t('Users')}
			</GenericTableHeaderCell>
			{mediaQuery && (
				<>
					<GenericTableHeaderCell key='messages' direction={sortDirection} active={sortBy === 'msgs'} onClick={setSort} sort='msgs'>
						{t('Msgs')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key='default' direction={sortDirection} active={sortBy === 'default'} onClick={setSort} sort='default'>
						{t('Default')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key='featured' direction={sortDirection} active={sortBy === 'featured'} onClick={setSort} sort='featured'>
						{t('Featured')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key='ts' direction={sortDirection} active={sortBy === 'ts'} onClick={setSort} sort='ts'>
						{t('Created_at')}
					</GenericTableHeaderCell>
				</>
			)}
		</>
	);

	return (
		<>
			<RoomsTableFilters setFilters={setRoomFilters} />
			{isLoading && (
				<GenericTable columns={columns}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={mediaQuery ? 7 : 4} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.rooms.length === 0 && <GenericNoResults />}
			{isSuccess && data.rooms.length > 0 && (
				<>
					<GenericTable columns={columns}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.rooms?.map((room) => (
								<RoomRow key={room._id} room={room} />
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

export default RoomsTable;
