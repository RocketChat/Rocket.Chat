import React, { useMemo, useState, useCallback } from 'react';
import { Box, Margins, Table, Flex, Avatar } from '@rocket.chat/fuselage';


import { useEndpointData } from '../../../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { DirectoryTable, Th } from './DirectoryTable';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { useRoute } from '../../../../../../../client/contexts/RouterContext';
import { usePermission } from '../../../../../../../client/contexts/AuthorizationContext';
import { useQuery, useFormatDate } from '../hooks';

export function UserTab({
	workspace = 'local',
}) {
	const [params, setParams] = useState({});
	const [sort, setSort] = useState(['name', 'asc']);
	const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');
	const t = useTranslation();

	const federation = workspace === 'external';

	const query = useQuery(params, sort, 'users', workspace);

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	const header = [
		<Th direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</Th>,
		canViewFullOtherUserInfo && <Th direction={sort[1]} active={sort[0] === 'email'} onClick={onHeaderClick} sort='email'>{t('Email')}</Th>,
		federation && <Th direction={sort[1]} active={sort[0] === 'origin'} onClick={onHeaderClick} sort='origin'>{t('Domain')}</Th>,
		<Th direction={sort[1]} active={sort[0] === 'email'} onClick={onHeaderClick} sort='createdAt'>{t('Joined_at')}</Th>,
	].filter(Boolean);

	const go = useRoute('direct');

	const data = useEndpointData('GET', 'directory', query) || {};

	const onClick = useMemo(() => (username) => (e) => {
		if (e.type === 'click' || e.key === 'Enter') {
			go({ rid: username });
		}
	}, []);

	const formatDate = useFormatDate();

	const renderRow = useCallback(({ createdAt, emails, _id, username, name, domain }) => <Table.Row key={_id} onKeyDown={onClick(username)} onClick={onClick(username)} tabIndex={0} role='link' action>
		<Table.Cell>
			<Flex.Container>
				<Box>
					<Flex.Item>
						<Box>
							<Avatar size='x40' title={username} url={username} />
						</Box>
					</Flex.Item>
					<Margins inline='x8'>
						<Flex.Item grow={1}>
							<Box>
								<Box textStyle='p2'>{name || username}</Box>
								<Box textStyle='p1' textColor='hint'>{name && username}</Box>
							</Box>
						</Flex.Item>
					</Margins>
				</Box>
			</Flex.Container>
		</Table.Cell>
		{canViewFullOtherUserInfo
			&& <Table.Cell>
				{emails && emails[0].address}
			</Table.Cell>}
		{federation
		&& <Table.Cell>
			{domain}
		</Table.Cell>}
		<Table.Cell textStyle='p1' textColor='hint' style={{ whiteSpace: 'nowrap' }}>
			{formatDate(createdAt)}
		</Table.Cell>
	</Table.Row>, []);

	return <DirectoryTable searchPlaceholder={t('Search_Users')} header={header} renderRow={renderRow} data={data} setParams={setParams} />;
}
