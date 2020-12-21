import { Box, Margins, Table, Avatar, Tag, Icon } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState, useCallback } from 'react';

import MarkdownText from '../../components/MarkdownText';
import FilterByText from '../../components/FilterByText';
import GenericTable from '../../components/GenericTable';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { useFormatDate } from '../../hooks/useFormatDate';
import { roomTypes } from '../../../app/utils/client';
import { useQuery } from './hooks';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

function RoomTags({ room }) {
	const t = useTranslation();
	return <Box mi='x4' alignItems='center' display='flex'>
		<Margins inline='x2'>
			{room.default && <Tag variant='primary'>{t('default')}</Tag>}
			{room.featured && <Tag variant='primary'>{t('featured')}</Tag>}
		</Margins>
	</Box>;
}

function ChannelsTable() {
	const t = useTranslation();
	const [sort, setSort] = useState(['name', 'asc']);
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const query = useQuery(params, sort, 'channels');

	const onHeaderClick = useCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'usersCount'} direction={sort[1]} active={sort[0] === 'usersCount'} onClick={onHeaderClick} sort='usersCount' style={{ width: '100px' }}>{t('Users')}</GenericTable.HeaderCell>,
		mediaQuery && <GenericTable.HeaderCell key={'createdAt'} direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' style={{ width: '150px' }}>{t('Created_at')}</GenericTable.HeaderCell>,
		mediaQuery && <GenericTable.HeaderCell key={'lastMessage'} direction={sort[1]} active={sort[0] === 'lastMessage'} onClick={onHeaderClick} sort='lastMessage' style={{ width: '150px' }}>{t('Last_Message')}</GenericTable.HeaderCell>,
	].filter(Boolean), [sort, onHeaderClick, t, mediaQuery]);

	const channelRoute = useRoute('channel');

	const { value: data = { result: [] } } = useEndpointData('directory', query);

	const onClick = useMemo(() => (name) => (e) => {
		if (e.type === 'click' || e.key === 'Enter') {
			channelRoute.push({ name });
		}
	}, [channelRoute]);

	const formatDate = useFormatDate();
	const renderRow = useCallback((room) => {
		const { _id, ts, t, name, fname, usersCount, lastMessage, topic } = room;
		const avatarUrl = roomTypes.getConfig(t).getAvatarPath(room);

		return <Table.Row key={_id} onKeyDown={onClick(name)} onClick={onClick(name)} tabIndex={0} role='link' action>
			<Table.Cell>
				<Box display='flex'>
					<Box flexGrow={0}>
						<Avatar size='x40' title={fname || name} url={avatarUrl} />
					</Box>
					<Box grow={1} mi='x8' style={style}>
						<Box display='flex' alignItems='center'>
							<Icon name={roomTypes.getIcon(room)} color='hint' /> <Box fontScale='p2' mi='x4'>{fname || name}</Box><RoomTags room={room} style={style} />
						</Box>
						{topic && <MarkdownText fontScale='p1' color='hint' style={style} withRichContent={false} content={topic} />}
					</Box>
				</Box>
			</Table.Cell>
			<Table.Cell fontScale='p1' color='hint' style={style}>
				{usersCount}
			</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint' style={style}>
				{formatDate(ts)}
			</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint' style={style}>
				{lastMessage && formatDate(lastMessage.ts)}
			</Table.Cell>}
		</Table.Row>;
	}
	, [formatDate, mediaQuery, onClick]);

	return <GenericTable
		header={header}
		renderFilter={({ onChange, ...props }) => <FilterByText placeholder={t('Search_Channels')} onChange={onChange} {...props} />}
		renderRow={renderRow}
		results={data.result}
		setParams={setParams}
		total={data.total}
	/>;
}

export default function ChannelsTab(props) {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <ChannelsTable {...props} />;
	}

	return <NotAuthorizedPage />;
}
