import { Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useMediaQuery, useDebouncedValue, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { OptionProp } from '@rocket.chat/ui-client';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, MutableRefObject } from 'react';
import React, { useRef, useEffect, useMemo } from 'react';

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
import RoomRow from './RoomRow';
import RoomsTableFilters from './RoomsTableFilters';

const DEFAULT_TYPES = ['d', 'p', 'c', 'l', 'discussions', 'teams'];

export type SearchFilters = {
	searchText: string;
	types: OptionProp[];
};

const RoomsTable = ({ reload }: { reload: MutableRefObject<() => void> }): ReactElement => {
	const t = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const [roomSearchText, setRoomSearchText] = useLocalStorage('roomSearchText', '');
	const [roomSearchTypes, setRoomSearchTypes] = useLocalStorage<OptionProp[]>('roomSearchTypes', []);

	const prevRoomFilters = useRef<SearchFilters>({
		searchText: roomSearchText,
		types: roomSearchTypes,
	});

	const { sortBy, sortDirection, setSort } = useSort<'name' | 't' | 'usersCount' | 'msgs' | 'default' | 'featured'>('name');
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const searchText = useDebouncedValue(roomSearchText, 500);

	const query = useDebouncedValue(
		useMemo(() => {
			const filtersChanged =
				searchText !== prevRoomFilters.current.searchText ||
				JSON.stringify(roomSearchTypes) !== JSON.stringify(prevRoomFilters.current.types);

			if (filtersChanged) {
				setCurrent(0);
			}

			return {
				filter: searchText || '',
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: filtersChanged ? 0 : current,
				types: roomSearchTypes.length ? [...roomSearchTypes.map((roomType: OptionProp) => roomType.id)] : DEFAULT_TYPES,
			};
		}, [searchText, roomSearchTypes, sortBy, sortDirection, itemsPerPage, current, setCurrent]),
		500,
	);

	const getAdminRooms = useEndpoint('GET', '/v1/rooms.adminRooms');

	const { data, refetch, isSuccess, isLoading, isError } = useQuery(['rooms', query, 'admin'], async () => getAdminRooms(query));

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

	useEffect(() => {
		prevRoomFilters.current = {
			searchText: roomSearchText,
			types: roomSearchTypes,
		};
	}, [roomSearchText, roomSearchTypes]);

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
				</>
			)}
		</>
	);

	return (
		<>
			<RoomsTableFilters setRoomSearchText={setRoomSearchText} setRoomSearchTypes={setRoomSearchTypes} prevRoomFilters={prevRoomFilters} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={mediaQuery ? 6 : 3} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.rooms.length === 0 && <GenericNoResults />}
			{isSuccess && data.rooms.length > 0 && (
				<>
					<GenericTable>
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
