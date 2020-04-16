import React, { useMemo, useState, useCallback } from 'react';
import { Box, Table, Flex, Avatar } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useEndpointData } from '../../../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { DirectoryTable, Th } from './DirectoryTable';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { useRoute } from '../../../../../../../client/contexts/RouterContext';
import { usePermission } from '../../../../../../../client/contexts/AuthorizationContext';
import { useQuery, useFormatDate } from '../hooks';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

export function UserTab({
	workspace = 'local',
}) {
	const [params, setParams] = useState({});
	const [sort, setSort] = useState(['name', 'asc']);
	const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');
	const t = useTranslation();

	const federation = workspace === 'external';

	const query = useQuery(params, sort, 'users', workspace);

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</Th>,
		mediaQuery && canViewFullOtherUserInfo && <Th key={'email'} direction={sort[1]} active={sort[0] === 'email'} onClick={onHeaderClick} sort='email' style={{ width: '200px' }} >{t('Email')}</Th>,
		federation && <Th key={'origin'} direction={sort[1]} active={sort[0] === 'origin'} onClick={onHeaderClick} sort='origin' style={{ width: '200px' }} >{t('Domain')}</Th>,
		mediaQuery && <Th key={'createdAt'} direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' style={{ width: '200px' }}>{t('Joined_at')}</Th>,
	].filter(Boolean), [sort, federation, canViewFullOtherUserInfo, mediaQuery]);

	const directRoute = useRoute('direct');

	const data = useEndpointData('GET', 'directory', query) || {};

	const onClick = useMemo(() => (username) => (e) => {
		if (e.type === 'click' || e.key === 'Enter') {
			directRoute.push({ rid: username });
		}
	}, [directRoute]);


	const formatDate = useFormatDate();

	const renderRow = useCallback(({ createdAt, emails, _id, username, name, domain, bio }) => <Table.Row key={_id} onKeyDown={onClick(username)} onClick={onClick(username)} tabIndex={0} role='link' action>
		<Table.Cell>
			<Flex.Container>
				<Box>
					<Flex.Item>
						<Avatar size='x40' title={username} url={username} />
					</Flex.Item>
					<Box style={style} grow={1} mi='x8'>
						<Box display='flex'>
							<Box textStyle='p2' style={style} textColor='default'>{name || username}</Box> <Box mi='x4'/> <Box textStyle='p1' textColor='hint' style={style}>{username}</Box>
						</Box>
						<Box textStyle='p1' textColor='hint' style={style}> {bio} </Box>
					</Box>
				</Box>
			</Flex.Container>
		</Table.Cell>
		{mediaQuery && canViewFullOtherUserInfo
			&& <Table.Cell style={style} >
				{emails && emails[0].address}
			</Table.Cell>}
		{federation
		&& <Table.Cell style={style}>
			{domain}
		</Table.Cell>}
		{mediaQuery && <Table.Cell textStyle='p1' textColor='hint' style={style}>
			{formatDate(createdAt)}
		</Table.Cell>}
	</Table.Row>, [mediaQuery, federation, canViewFullOtherUserInfo]);

	return <DirectoryTable searchPlaceholder={t('Search_Users')} header={header} renderRow={renderRow} data={data} setParams={setParams} />;
}
