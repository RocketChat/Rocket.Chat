import React, { useMemo, useState, useCallback } from 'react';
import { Box, Margins, Table, Flex, Avatar, Tag } from '@rocket.chat/fuselage';

import { useEndpointData } from '../../../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { DirectoryTable, Th } from './DirectoryTable';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { useRoute } from '../../../../../../../client/contexts/RouterContext';
import { useQuery, useFormatDate } from '../hooks';

export function ChannelsTab() {
	const t = useTranslation();
	const [sort, setSort] = useState(['name', 'asc']);
	const [params, setParams] = useState({});

	const query = useQuery(params, sort, 'channels');

	const onHeaderClick = useCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	const header = [
		<Th direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</Th>,
		<Th direction={sort[1]} active={sort[0] === 'usersCount'} onClick={onHeaderClick} sort='usersCount'>{t('Users')}</Th>,
		<Th direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt'>{t('Created_at')}</Th>,
		<Th direction={sort[1]} active={sort[0] === 'lastMessage'} onClick={onHeaderClick} sort='lastMessage'>{t('Last_Message')}</Th>,
		<Th>{t('Topic')}</Th>,
	];

	const go = useRoute('channel');

	const data = useEndpointData('GET', 'directory', query) || {};

	const onClick = useMemo(() => (name) => (e) => {
		if (e.type === 'click' || e.key === 'Enter') {
			go({ name });
		}
	}, []);

	const formatDate = useFormatDate();
	const renderRow = useCallback(({ _id, ts, default: d, name, description, usersCount, lastMessage, topic, ...rest }) => <Table.Row key={_id} onKeyDown={onClick(name)} onClick={onClick(name)} tabIndex={0} role='link' action>
		<Table.Cell>
			{console.log(rest)}
			<Flex.Container>
				<Box>
					<Flex.Item>
						<Box>
							<Avatar size='x40' title={name} url={`%40${ name }`} />
						</Box>
					</Flex.Item>
					<Margins inline='x8'>
						<Flex.Item grow={1}>
							<Box>
								<Box textStyle='p2'>{name} {d && <Tag variant='primary'>{t('default')}</Tag>}</Box>
								{description && <Box textStyle='p1' textColor='hint'>{description}</Box> }
							</Box>
						</Flex.Item>
					</Margins>
				</Box>
			</Flex.Container>
		</Table.Cell>
		<Table.Cell textStyle='p1' textColor='hint' style={{ whiteSpace: 'nowrap' }}>
			{usersCount}
		</Table.Cell>
		<Table.Cell textStyle='p1' textColor='hint' style={{ whiteSpace: 'nowrap' }}>
			{formatDate(ts)}
		</Table.Cell>
		<Table.Cell textStyle='p1' textColor='hint' style={{ whiteSpace: 'nowrap' }}>
			{lastMessage && formatDate(lastMessage.ts)}
		</Table.Cell>
		<Table.Cell textStyle='p1' textColor='hint' style={{ whiteSpace: 'nowrap' }}>
			{topic}
		</Table.Cell>
	</Table.Row>
	, []);

	return <DirectoryTable searchPlaceholder={t('Search_Channels')} header={header} renderRow={renderRow} data={data} setParams={setParams} />;
}
