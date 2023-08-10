import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Icon, Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useMediaQuery, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRoute, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { CSSProperties, ReactElement, MutableRefObject } from 'react';
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';

import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import FilterByTypeAndText from './FilterByTypeAndText';

const style: CSSProperties = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

type RoomFilters = {
	types: string[];
	text: string;
};

const DEFAULT_TYPES = ['d', 'p', 'c', 'l', 'discussions', 'teams'];

const roomTypeI18nMap = {
	l: 'Omnichannel',
	c: 'Channel',
	d: 'Direct',
	p: 'Group',
	discussion: 'Discussion',
} as const;

const getRoomType = (room: IRoom): (typeof roomTypeI18nMap)[keyof typeof roomTypeI18nMap] | 'Teams_Public_Team' | 'Teams_Private_Team' => {
	if (room.teamMain) {
		return room.t === 'c' ? 'Teams_Public_Team' : 'Teams_Private_Team';
	}
	return roomTypeI18nMap[room.t as keyof typeof roomTypeI18nMap];
};

const getRoomDisplayName = (room: IRoom): string | undefined =>
	room.t === 'd' ? room.usernames?.join(' x ') : roomCoordinator.getRoomName(room.t, room);

const RoomsTable = ({ reload }: { reload: MutableRefObject<() => void> }): ReactElement => {
	const mediaQuery = useMediaQuery('(min-width: 1024px)');
	const routeName = 'admin-rooms';

	const t = useTranslation();

	const [roomFilter, setRoomFilter] = useState<RoomFilters>({ text: '', types: DEFAULT_TYPES });
	const prevRoomFilterText = useRef<RoomFilters>(roomFilter);

	const { sortBy, sortDirection, setSort } = useSort<'name' | 't' | 'usersCount' | 'msgs' | 'default' | 'featured'>('name');
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const params = useDebouncedValue(roomFilter, 500);

	const query = useDebouncedValue(
		useMemo(() => {
			if (params.text !== prevRoomFilterText.current.text || params.types !== prevRoomFilterText.current.types) {
				setCurrent(0);
			}
			return {
				filter: params.text || '',
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: params.text === prevRoomFilterText.current.text && params.types === prevRoomFilterText.current.types ? current : 0,
				types: params.types || DEFAULT_TYPES,
			};
		}, [params.text, params.types, sortBy, sortDirection, itemsPerPage, prevRoomFilterText, current, setCurrent]),
		500,
	);

	const getAdminRooms = useEndpoint('GET', '/v1/rooms.adminRooms');

	const dispatchToastMessage = useToastMessageDispatch();

	const { data, refetch, isSuccess, isLoading, isError } = useQuery(
		['rooms', query, 'admin'],
		async () => {
			const adminRooms = await getAdminRooms(query);

			return { ...adminRooms, rooms: adminRooms.rooms as IRoom[] };
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

	useEffect(() => {
		prevRoomFilterText.current = { text: params.text, types: params.types };
	}, [params.text, params.types]);

	const router = useRoute(routeName);

	const onClick = useCallback(
		(rid) => (): void =>
			router.push({
				context: 'edit',
				id: rid,
			}),
		[router],
	);

	const headers = useMemo(
		() =>
			[
				<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name' w='x200'>
					{t('Name')}
				</GenericTableHeaderCell>,
				<GenericTableHeaderCell key='type' direction={sortDirection} active={sortBy === 't'} onClick={setSort} sort='t' w='x100'>
					{t('Type')}
				</GenericTableHeaderCell>,
				<GenericTableHeaderCell
					key='users'
					direction={sortDirection}
					active={sortBy === 'usersCount'}
					onClick={setSort}
					sort='usersCount'
					w='x80'
				>
					{t('Users')}
				</GenericTableHeaderCell>,
				mediaQuery && (
					<GenericTableHeaderCell key='messages' direction={sortDirection} active={sortBy === 'msgs'} onClick={setSort} sort='msgs' w='x80'>
						{t('Msgs')}
					</GenericTableHeaderCell>
				),
				mediaQuery && (
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
				),
				mediaQuery && (
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
				),
			].filter(Boolean),
		[sortDirection, sortBy, setSort, t, mediaQuery],
	);

	const renderRow = useCallback(
		(room: IRoom) => {
			const { _id, t: type, usersCount, msgs, default: isDefault, featured, ...args } = room;
			const icon = roomCoordinator.getRoomDirectives(room.t).getIcon?.(room);
			const roomName = getRoomDisplayName(room);

			return (
				<GenericTableRow action key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' qa-room-id={_id}>
					<GenericTableCell style={style}>
						<Box display='flex' alignContent='center'>
							<RoomAvatar size={mediaQuery ? 'x28' : 'x40'} room={{ type, name: roomName, _id, ...args }} />
							<Box display='flex' style={style} mi={8}>
								<Box display='flex' flexDirection='row' alignSelf='center' alignItems='center' style={style}>
									{icon && <Icon mi={2} name={icon} fontScale='p2m' color='hint' />}
									<Box fontScale='p2m' style={style} color='default' qa-room-name={roomName}>
										{roomName}
									</Box>
								</Box>
							</Box>
						</Box>
					</GenericTableCell>
					<GenericTableCell>
						<Box color='hint' fontScale='p2m' style={style}>
							{t(getRoomType(room))}
						</Box>
						<Box mi={4} />
					</GenericTableCell>
					<GenericTableCell style={style}>{usersCount}</GenericTableCell>
					{mediaQuery && <GenericTableCell style={style}>{msgs}</GenericTableCell>}
					{mediaQuery && <GenericTableCell style={style}>{isDefault ? t('True') : t('False')}</GenericTableCell>}
					{mediaQuery && <GenericTableCell style={style}>{featured ? t('True') : t('False')}</GenericTableCell>}
				</GenericTableRow>
			);
		},
		[mediaQuery, onClick, t],
	);

	return (
		<>
			<FilterByTypeAndText setFilter={setRoomFilter} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={6} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data && data?.rooms.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>{isSuccess && data?.rooms.map((room) => renderRow(room))}</GenericTableBody>
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
			{isSuccess && data && data.rooms.length === 0 && <GenericNoResults />}
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
