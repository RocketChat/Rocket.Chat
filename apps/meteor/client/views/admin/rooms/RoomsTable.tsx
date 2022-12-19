import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Table, Icon } from '@rocket.chat/fuselage';
import { useMediaQuery, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { CSSProperties, ReactElement, MutableRefObject } from 'react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import GenericTable from '../../../components/GenericTable';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import FilterByTypeAndText from './FilterByTypeAndText';

type RoomParamsType = {
	text?: string;
	types?: string[];
	current: number;
	itemsPerPage: 25 | 50 | 100;
};

const style: CSSProperties = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

export const DEFAULT_TYPES = ['d', 'p', 'c', 'teams'];

const useQuery = (
	{
		text,
		types,
		itemsPerPage,
		current,
	}: {
		text?: string;
		types?: string[];
		itemsPerPage?: 25 | 50 | 100;
		current?: number;
	},
	[column, direction]: [string, 'asc' | 'desc'],
): {
	filter: string;
	types: string[];
	sort: string;
	count?: number;
	offset?: number;
} =>
	useMemo(
		() => ({
			filter: text || '',
			types: types || [],
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[text, types, itemsPerPage, current, column, direction],
	);

export const roomTypeI18nMap = {
	l: 'Omnichannel',
	c: 'Channel',
	d: 'Direct',
	p: 'Group',
	discussion: 'Discussion',
} as const;

const getRoomType = (room: IRoom): typeof roomTypeI18nMap[keyof typeof roomTypeI18nMap] | 'Teams_Public_Team' | 'Teams_Private_Team' => {
	if (room.teamMain) {
		return room.t === 'c' ? 'Teams_Public_Team' : 'Teams_Private_Team';
	}
	return roomTypeI18nMap[room.t as keyof typeof roomTypeI18nMap];
};

const getRoomDisplayName = (room: IRoom): string | undefined =>
	room.t === 'd' ? room.usernames?.join(' x ') : roomCoordinator.getRoomName(room.t, room);

const useDisplayData = (asyncState: any, sort: [string, 'asc' | 'desc']): IRoom[] =>
	useMemo(() => {
		const { value = {}, phase } = asyncState;

		if (phase === AsyncStatePhase.LOADING) {
			return null;
		}

		if (sort[0] === 'name' && value.rooms) {
			return value.rooms.sort((a: IRoom, b: IRoom) => {
				const aName = getRoomDisplayName(a) || '';
				const bName = getRoomDisplayName(b) || '';
				if (aName === bName) {
					return 0;
				}
				const result = aName < bName ? -1 : 1;
				return sort[1] === 'asc' ? result : result * -1;
			});
		}
		return value.rooms;
	}, [asyncState, sort]);

const RoomsTable = ({ reload }: { reload: MutableRefObject<() => void> }): ReactElement => {
	const t = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const routeName = 'admin-rooms';

	const [params, setParams] = useState<RoomParamsType>({
		text: '',
		types: DEFAULT_TYPES,
		current: 0,
		itemsPerPage: 25,
	});
	const [sort, setSort] = useState<[string, 'asc' | 'desc']>(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort);

	const endpointData = useEndpointData('/v1/rooms.adminRooms', query);

	const { value: data, reload: reloadEndPoint } = endpointData;

	useEffect(() => {
		reload.current = reloadEndPoint;
	}, [reload, reloadEndPoint]);

	const router = useRoute(routeName);

	const onClick = useCallback(
		(rid) => (): void =>
			router.push({
				context: 'edit',
				id: rid,
			}),
		[router],
	);

	const onHeaderClick = useCallback(
		(id) => {
			const [sortBy, sortDirection] = sort;

			if (sortBy === id) {
				setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
				return;
			}
			setSort([id, 'asc']);
		},
		[sort, setSort],
	);

	const displayData = useDisplayData(endpointData, sort);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>
					{t('Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'type'} direction={sort[1]} active={sort[0] === 't'} onClick={onHeaderClick} sort='t' w='x100'>
					{t('Type')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'users'}
					direction={sort[1]}
					active={sort[0] === 'usersCount'}
					onClick={onHeaderClick}
					sort='usersCount'
					w='x80'
				>
					{t('Users')}
				</GenericTable.HeaderCell>,
				mediaQuery && (
					<GenericTable.HeaderCell
						key={'messages'}
						direction={sort[1]}
						active={sort[0] === 'msgs'}
						onClick={onHeaderClick}
						sort='msgs'
						w='x80'
					>
						{t('Msgs')}
					</GenericTable.HeaderCell>
				),
				mediaQuery && (
					<GenericTable.HeaderCell
						key={'default'}
						direction={sort[1]}
						active={sort[0] === 'default'}
						onClick={onHeaderClick}
						sort='default'
						w='x80'
					>
						{t('Default')}
					</GenericTable.HeaderCell>
				),
				mediaQuery && (
					<GenericTable.HeaderCell
						key={'featured'}
						direction={sort[1]}
						active={sort[0] === 'featured'}
						onClick={onHeaderClick}
						sort='featured'
						w='x80'
					>
						{t('Featured')}
					</GenericTable.HeaderCell>
				),
			].filter(Boolean),
		[sort, onHeaderClick, t, mediaQuery],
	);

	const renderRow = useCallback(
		(room) => {
			const { _id, t: type, usersCount, msgs, default: isDefault, featured, ...args } = room;
			const icon = roomCoordinator.getIcon(room);
			const roomName = getRoomDisplayName(room);

			return (
				<Table.Row action key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' qa-room-id={_id}>
					<Table.Cell style={style}>
						<Box display='flex' alignContent='center'>
							<RoomAvatar size={mediaQuery ? 'x28' : 'x40'} room={{ type, name: roomName, _id, ...args }} />
							<Box display='flex' style={style} mi='x8'>
								<Box display='flex' flexDirection='row' alignSelf='center' alignItems='center' style={style}>
									{icon && <Icon mi='x2' name={icon === 'omnichannel' ? 'livechat' : icon} fontScale='p2m' color='hint' />}
									<Box fontScale='p2m' style={style} color='default'>
										{roomName}
									</Box>
								</Box>
							</Box>
						</Box>
					</Table.Cell>
					<Table.Cell>
						<Box color='hint' fontScale='p2m' style={style}>
							{t(getRoomType(room))}
						</Box>
						<Box mi='x4' />
					</Table.Cell>
					<Table.Cell style={style}>{usersCount}</Table.Cell>
					{mediaQuery && <Table.Cell style={style}>{msgs}</Table.Cell>}
					{mediaQuery && <Table.Cell style={style}>{isDefault ? t('True') : t('False')}</Table.Cell>}
					{mediaQuery && <Table.Cell style={style}>{featured ? t('True') : t('False')}</Table.Cell>}
				</Table.Row>
			);
		},
		[mediaQuery, onClick, t],
	);

	return (
		<GenericTable
			header={header}
			renderRow={renderRow}
			results={displayData}
			total={data?.total}
			params={params}
			setParams={setParams}
			renderFilter={({ onChange, ...props }): ReactElement => <FilterByTypeAndText setFilter={onChange} {...props} />}
		/>
	);
};

export default RoomsTable;
