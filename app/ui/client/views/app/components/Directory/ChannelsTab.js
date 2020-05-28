import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Box, Margins, Table, Avatar, Tag, Icon, TextInput } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { GenericTable, Th } from '../../../../components/GenericTable';
import MarkdownText from '../../../../../../../client/components/basic/MarkdownText';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { usePermission } from '../../../../../../../client/contexts/AuthorizationContext';
import { useRoute } from '../../../../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../../../../client/hooks/useEndpointData';
import { useFormatDate } from '../../../../../../../client/hooks/useFormatDate';
import { roomTypes } from '../../../../../../utils/client';
import { useQuery } from '../hooks';

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

const FilterByText = ({ setFilter, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [text]);

	return <Box flexShrink={0} mb='x16' is='form' display='flex' flexDirection='column' {...props}>
		<TextInput flexShrink={0} placeholder={t('Search_Channels')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

export function ChannelsTab() {
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
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</Th>,
		<Th key={'usersCount'} direction={sort[1]} active={sort[0] === 'usersCount'} onClick={onHeaderClick} sort='usersCount' style={{ width: '100px' }}>{t('Users')}</Th>,
		mediaQuery && <Th key={'createdAt'} direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' style={{ width: '150px' }}>{t('Created_at')}</Th>,
		mediaQuery && <Th key={'lastMessage'} direction={sort[1]} active={sort[0] === 'lastMessage'} onClick={onHeaderClick} sort='lastMessage' style={{ width: '150px' }}>{t('Last_Message')}</Th>,
	].filter(Boolean), [sort, mediaQuery]);

	const channelRoute = useRoute('channel');

	const canViewPublicRooms = usePermission('view-c-room');

	const data = (canViewPublicRooms && useEndpointData('directory', query)) || { result: [] };

	const onClick = useMemo(() => (name) => (e) => {
		if (e.type === 'click' || e.key === 'Enter') {
			channelRoute.push({ name });
		}
	}, [channelRoute]);

	const formatDate = useFormatDate();
	const renderRow = useCallback(({ _id, ts, name, fname, description, usersCount, lastMessage, topic, ...room }) => {
		const avatarUrl = roomTypes.getConfig('d').getAvatarPath({ name: name || fname, type: 'd', _id });

		return <Table.Row key={_id} onKeyDown={onClick(name)} onClick={onClick(name)} tabIndex={0} role='link' action>
			<Table.Cell>
				<Box display='flex'>
					<Avatar size='x40' title={fname || name} url={avatarUrl} flexGrow={0} />
					<Box grow={1} mi='x8' style={style}>
						<Box display='flex' alignItems='center'>
							<Icon name={roomTypes.getIcon(room)} color='hint' /> <Box fontScale='p2' mi='x4'>{fname || name}</Box><RoomTags room={room} style={style} />
						</Box>
						{topic && <Box fontScale='p1' color='hint' style={style}>
							<MarkdownText>{topic}</MarkdownText>
						</Box>}
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
	, [mediaQuery]);

	return <GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data.result} total={data.total} setParams={setParams} />;
}
