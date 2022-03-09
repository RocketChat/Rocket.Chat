import { Box, Table, Icon } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback } from 'react';

import GenericTable from '../../../components/GenericTable';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import FilterByTypeAndText from './FilterByTypeAndText';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

export const roomTypeI18nMap = {
	l: 'Omnichannel',
	c: 'Channel',
	d: 'Direct',
	p: 'Group',
	discussion: 'Discussion',
};

const getRoomType = (room) => {
	if (room.teamMain) {
		return room.t === 'c' ? 'Teams_Public_Team' : 'Teams_Private_Team';
	}
	return roomTypeI18nMap[room.t];
};

const getRoomDisplayName = (room) => (room.t === 'd' ? room.usernames.join(' x ') : roomCoordinator.getRoomName(room.t, room));

const useDisplayData = (asyncState, sort) =>
	useMemo(() => {
		const { value = {}, phase } = asyncState;

		if (phase === AsyncStatePhase.LOADING) {
			return null;
		}

		if (sort[0] === 'name' && value.rooms) {
			return value.rooms.sort((a, b) => {
				const aName = getRoomDisplayName(a);
				const bName = getRoomDisplayName(b);
				if (aName === bName) {
					return 0;
				}
				const result = aName < bName ? -1 : 1;
				return sort[1] === 'asc' ? result : result * -1;
			});
		}
		return value.rooms;
	}, [asyncState, sort]);

function RoomsTable({ endpointData, params, onChangeParams, sort, onChangeSort }) {
	const t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const routeName = 'admin-rooms';

	const { value: data = {} } = endpointData;

	const router = useRoute(routeName);

	const onClick = useCallback(
		(rid) => () =>
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
				onChangeSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
				return;
			}
			onChangeSort([id, 'asc']);
		},
		[sort, onChangeSort],
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
			const { _id, name, t: type, usersCount, msgs, default: isDefault, featured, usernames, ...args } = room;
			const icon = roomCoordinator.getIcon(room);
			const roomName = getRoomDisplayName(room);

			return (
				<Table.Row action key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' qa-room-id={_id}>
					<Table.Cell style={style}>
						<Box display='flex' alignContent='center'>
							<RoomAvatar size={mediaQuery ? 'x28' : 'x40'} room={{ type, name: roomName, _id, ...args }} />
							<Box display='flex' style={style} mi='x8'>
								<Box display='flex' flexDirection='row' alignSelf='center' alignItems='center' style={style}>
									<Icon mi='x2' name={icon === 'omnichannel' ? 'livechat' : icon} fontScale='p2m' color='hint' />
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
			total={data.total}
			setParams={onChangeParams}
			params={params}
			renderFilter={({ onChange, ...props }) => <FilterByTypeAndText setFilter={onChange} {...props} />}
		/>
	);
}

export default RoomsTable;
