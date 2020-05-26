import React, { useMemo, useState, useCallback } from 'react';
import { Box, Margins, Table, Avatar, Tag, Icon } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useEndpointData } from '../../../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { DirectoryTable, Th, Markdown } from './DirectoryTable';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { useRoute } from '../../../../../../../client/contexts/RouterContext';
import { useQuery, useFormatDate } from '../hooks';
import { roomTypes } from '../../../../../../utils/client';
import { usePermission } from '../../../../../../../client/contexts/AuthorizationContext';

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

export function ChannelsTab() {
	const t = useTranslation();
	const [sort, setSort] = useState(['name', 'asc']);
	const [params, setParams] = useState({});

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
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</Th>,
		<Th key={'usersCount'} direction={sort[1]} active={sort[0] === 'usersCount'} onClick={onHeaderClick} sort='usersCount' style={{ width: '100px' }}>{t('Users')}</Th>,
		mediaQuery && <Th key={'createdAt'} direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' style={{ width: '150px' }}>{t('Created_at')}</Th>,
		mediaQuery && <Th key={'lastMessage'} direction={sort[1]} active={sort[0] === 'lastMessage'} onClick={onHeaderClick} sort='lastMessage' style={{ width: '150px' }}>{t('Last_Message')}</Th>,
	].filter(Boolean), [sort, mediaQuery]);

	const channelRoute = useRoute('channel');

	const canViewPublicRooms = usePermission('view-c-room');

	const data = (canViewPublicRooms && useEndpointData('GET', 'directory', query)) || { result: [] };

	const onClick = useMemo(() => (name) => (e) => {
		if (e.type === 'click' || e.key === 'Enter') {
			channelRoute.push({ name });
		}
	}, [channelRoute]);

	const formatDate = useFormatDate();
	const renderRow = useCallback(({ _id, ts, name, fname, description, usersCount, lastMessage, topic, ...room }) => <Table.Row key={_id} onKeyDown={onClick(name)} onClick={onClick(name)} tabIndex={0} role='link' action>
		<Table.Cell>
			<Box display='flex'>
				<Avatar size='x40' title={fname || name} url={`%40${ fname || name }`} flexGrow={0} />
				<Box grow={1} mi='x8' style={style}>
					<Box display='flex' alignItems='center'>
						<Icon name={roomTypes.getIcon(room)} textColor='hint' /> <Box textStyle='p2' textColor='default' mi='x4'>{fname || name}</Box><RoomTags room={room} style={style} />
					</Box>
					{topic && <Markdown textStyle='p1' textColor='hint' style={style}>{topic}</Markdown> }
				</Box>
			</Box>
		</Table.Cell>
		<Table.Cell textStyle='p1' textColor='hint' style={style}>
			{usersCount}
		</Table.Cell>
		{ mediaQuery && <Table.Cell textStyle='p1' textColor='hint' style={style}>
			{formatDate(ts)}
		</Table.Cell>}
		{ mediaQuery && <Table.Cell textStyle='p1' textColor='hint' style={style}>
			{lastMessage && formatDate(lastMessage.ts)}
		</Table.Cell>}
	</Table.Row>
	, [mediaQuery]);

	return <DirectoryTable searchPlaceholder={t('Search_Channels')} header={header} renderRow={renderRow} data={data} setParams={setParams} />;
}
