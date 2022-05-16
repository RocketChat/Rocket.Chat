import { Box, Table, Avatar, Icon } from '@rocket.chat/fuselage';
import { useMediaQuery, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useState, useCallback } from 'react';

import FilterByText from '../../components/FilterByText';
import GenericTable from '../../components/GenericTable';
import MarkdownText from '../../components/MarkdownText';
import { useEndpointData } from '../../hooks/useEndpointData';
import { useFormatDate } from '../../hooks/useFormatDate';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import RoomTags from './RoomTags';
import { useQuery } from './hooks';

const style = {
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
	overflow: 'hidden',
};

function ChannelsTable() {
	const t = useTranslation();
	const refAutoFocus = useAutoFocus(true);
	const [sort, setSort] = useState(['name', 'asc']);
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const query = useQuery(params, sort, 'channels');

	const onHeaderClick = useCallback(
		(id) => {
			const [sortBy, sortDirection] = sort;

			if (sortBy === id) {
				setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
				return;
			}
			setSort([id, 'asc']);
		},
		[sort],
	);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>
					{t('Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'usersCount'}
					direction={sort[1]}
					active={sort[0] === 'usersCount'}
					onClick={onHeaderClick}
					sort='usersCount'
					style={{ width: '100px' }}
				>
					{t('Users')}
				</GenericTable.HeaderCell>,
				mediaQuery && (
					<GenericTable.HeaderCell
						key={'createdAt'}
						direction={sort[1]}
						active={sort[0] === 'createdAt'}
						onClick={onHeaderClick}
						sort='createdAt'
						style={{ width: '150px' }}
					>
						{t('Created_at')}
					</GenericTable.HeaderCell>
				),
				mediaQuery && (
					<GenericTable.HeaderCell
						key={'lastMessage'}
						direction={sort[1]}
						active={sort[0] === 'lastMessage'}
						onClick={onHeaderClick}
						sort='lastMessage'
						style={{ width: '150px' }}
					>
						{t('Last_Message')}
					</GenericTable.HeaderCell>
				),
				mediaQuery && (
					<GenericTable.HeaderCell key={'belongsTo'} style={{ width: '150px' }}>
						{t('Belongs_To')}
					</GenericTable.HeaderCell>
				),
			].filter(Boolean),
		[sort, onHeaderClick, t, mediaQuery],
	);

	const channelRoute = useRoute('channel');
	const groupsRoute = useRoute('group');

	const { value: data = {} } = useEndpointData('directory', query);

	const onClick = useMemo(
		() => (name, type) => (e) => {
			if (e.type === 'click' || e.key === 'Enter') {
				type === 'c' ? channelRoute.push({ name }) : groupsRoute.push({ name });
			}
		},
		[channelRoute, groupsRoute],
	);

	const formatDate = useFormatDate();
	const renderRow = useCallback(
		(room) => {
			const { _id, ts, t, name, fname, usersCount, lastMessage, topic, belongsTo } = room;
			const avatarUrl = roomCoordinator.getRoomDirectives(t)?.getAvatarPath(room);

			return (
				<Table.Row key={_id} onKeyDown={onClick(name, t)} onClick={onClick(name, t)} tabIndex={0} role='link' action>
					<Table.Cell>
						<Box display='flex'>
							<Box flexGrow={0}>
								<Avatar size='x40' title={fname || name} url={avatarUrl} />
							</Box>
							<Box grow={1} mi='x8' style={style}>
								<Box display='flex' alignItems='center'>
									<Icon name={roomCoordinator.getIcon(room)} color='hint' />{' '}
									<Box fontScale='p2m' mi='x4'>
										{fname || name}
									</Box>
									<RoomTags room={room} style={style} />
								</Box>
								{topic && <MarkdownText variant='inlineWithoutBreaks' fontScale='p2' color='hint' style={style} content={topic} />}
							</Box>
						</Box>
					</Table.Cell>
					<Table.Cell fontScale='p2' color='hint' style={style}>
						{usersCount}
					</Table.Cell>
					{mediaQuery && (
						<Table.Cell fontScale='p2' color='hint' style={style}>
							{formatDate(ts)}
						</Table.Cell>
					)}
					{mediaQuery && (
						<Table.Cell fontScale='p2' color='hint' style={style}>
							{lastMessage && formatDate(lastMessage.ts)}
						</Table.Cell>
					)}
					{mediaQuery && (
						<Table.Cell fontScale='p2' color='hint' style={style}>
							{belongsTo}
						</Table.Cell>
					)}
				</Table.Row>
			);
		},
		[formatDate, mediaQuery, onClick],
	);

	return (
		<GenericTable
			header={header}
			renderFilter={({ onChange, ...props }) => (
				<FilterByText placeholder={t('Search_Channels')} inputRef={refAutoFocus} onChange={onChange} {...props} />
			)}
			renderRow={renderRow}
			results={data.result}
			setParams={setParams}
			total={data.total}
		/>
	);
}

export default ChannelsTable;
