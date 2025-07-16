import { Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useMediaQuery, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { OptionProp } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, MutableRefObject } from 'react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import RoomRow from './RoomRow';
import RoomsTableFilters from './RoomsTableFilters';
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

type RoomFilters = {
	searchText: string;
	types: OptionProp[];
};

const DEFAULT_TYPES = ['d', 'p', 'c', 'l', 'discussions', 'teams'];

const RoomsTable = ({ reload }: { reload: MutableRefObject<() => void> }): ReactElement => {
	const { t } = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const [roomFilters, setRoomFilters] = useState<RoomFilters>({ searchText: '', types: [] });

	const prevRoomFilterText = useRef<string>(roomFilters.searchText);

	const { sortBy, sortDirection, setSort } = useSort<'name' | 't' | 'usersCount' | 'msgs' | 'default' | 'featured' | 'ts'>('name');
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const searchText = useDebouncedValue(roomFilters.searchText, 500);

	const query = useDebouncedValue(
		useMemo(() => {
			if (searchText !== prevRoomFilterText.current) {
				setCurrent(0);
			}
			return {
				filter: searchText || '',
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: searchText === prevRoomFilterText.current ? current : 0,
				types: roomFilters.types.length ? [...roomFilters.types.map((roomType) => roomType.id)] : DEFAULT_TYPES,
			};
		}, [searchText, sortBy, sortDirection, itemsPerPage, current, roomFilters.types, setCurrent]),
		500,
	);

	const getAdminRooms = useEndpoint('GET', '/v1/rooms.adminRooms');

	const { data, refetch, isSuccess, isLoading, isError } = useQuery({
		queryKey: ['rooms', query, 'admin'],
		queryFn: async () => getAdminRooms(query),
	});

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

	useEffect(() => {
		prevRoomFilterText.current = searchText;
	}, [searchText]);

	const headers = (
		<>
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name' w='x200'>
				{t('Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='type' direction={sortDirection} active={sortBy === 't'} onClick={setSort} sort='t' w='x100'>
				{t('Type')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='users'
				direction={sortDirection}
				active={sortBy === 'usersCount'}
				onClick={setSort}
				sort='usersCount'
				w='x80'
			>
				{t('Users')}
			</GenericTableHeaderCell>
			{mediaQuery && (
				<>
					<GenericTableHeaderCell key='messages' direction={sortDirection} active={sortBy === 'msgs'} onClick={setSort} sort='msgs' w='x80'>
						{t('Msgs')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell
						key='default'
						direction={sortDirection}
						active={sortBy === 'default'}
						onClick={setSort}
						sort='default'
						w='x80'
					>
						{t('Default')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell
						key='featured'
						direction={sortDirection}
						active={sortBy === 'featured'}
						onClick={setSort}
						sort='featured'
						w='x80'
					>
						{t('Featured')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key='ts' direction={sortDirection} active={sortBy === 'ts'} onClick={setSort} sort='ts' w='x120'>
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
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={mediaQuery ? 7 : 4} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.rooms.length === 0 && <GenericNoResults />}
			{isSuccess && data.rooms.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>{data.rooms?.map((room) => <RoomRow key={room._id} room={room} />)}</GenericTableBody>
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
