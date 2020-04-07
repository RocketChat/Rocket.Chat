import React, { useMemo, useState, useCallback } from 'react';
import { Box, Table, Flex, Avatar } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useEndpointData } from '../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { DirectoryTable, Th } from '../../../../app/ui/client/views/app/components/Directory/DirectoryTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoute } from '../../../contexts/RouterContext';
// import { usePermission } from '../../../contexts/AuthorizationContext';
import { useQuery } from '../../../../app/ui/client/views/app/components/hooks';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

export function UsersTab({
	workspace = 'local',
}) {
	const [params, setParams] = useState({});
	const [sort, setSort] = useState(['name', 'asc']);

	// const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');

	const t = useTranslation();

	const federation = workspace === 'external';

	const query = useQuery(params, sort, 'users', workspace);

	const mediaQuery = useMediaQuery('(min-width: 700px)');

	const go = useRoute('direct');

	const data = useEndpointData('GET', 'users.list', query) || {};

	const onClick = useMemo(() => (username) => (e) => {
		if (e.type === 'click' || e.key === 'Enter') {
			go({ rid: username });
		}
	}, []);

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</Th>,
		mediaQuery && <Th key={'username'} direction={sort[1]} active={sort[0] === 'username'} onClick={onHeaderClick} sort='username' w='x140'>{t('Username')}</Th>,
		<Th key={'email'} direction={sort[1]} active={sort[0] === 'email'} onClick={onHeaderClick} sort='email' w='x120'>{t('Email')}</Th>,
		mediaQuery && <Th key={'roles'} direction={sort[1]} active={sort[0] === 'roles'} onClick={onHeaderClick} sort='roles' w='x120'>{t('Roles')}</Th>,
		federation && <Th key={'origin'} direction={sort[1]} active={sort[0] === 'origin'} onClick={onHeaderClick} sort='origin' w='x200' >{t('Domain')}</Th>,
		<Th key={'status'} direction={sort[1]} active={sort[0] === 'status'} onClick={onHeaderClick} sort='status' w='x100'>{t('Status')}</Th>,
	].filter(Boolean), [sort, federation, mediaQuery]);

	const renderRow = useCallback(({ emails, _id, username, name, domain, roles, status }) => <Table.Row key={_id} onKeyDown={onClick(username)} onClick={onClick(username)} tabIndex={0} role='link' action>
		<Table.Cell style={style}>
			<Flex.Container>
				<Box>
					<Avatar size='x40' title={username} url={username} />
					<Box display='flex' style={style} mi='x8'>
						<Box display='flex' flexDirection='column' alignSelf='center' style={style}>
							<Box textStyle='p2' style={style} textColor='default'>{name || username}</Box>
							{!mediaQuery && name && <Box textStyle='p1' textColor='hint' style={style}> {`@${ username }`} </Box>}
						</Box>
					</Box>
				</Box>
			</Flex.Container>
		</Table.Cell>
		{mediaQuery && <Table.Cell>
			<Box textStyle='p2' style={style} textColor='default'>{ username }</Box> <Box mi='x4'/>
		</Table.Cell>}
		<Table.Cell style={style}>{emails && emails[0].address}</Table.Cell>
		{mediaQuery && <Table.Cell style={style}>{roles && roles.join(', ')}</Table.Cell>}
		{federation && <Table.Cell style={style}>{domain}</Table.Cell>}
		<Table.Cell textStyle='p1' textColor='hint' style={style}>{status}</Table.Cell>
	</Table.Row>, [mediaQuery, federation]);

	return <DirectoryTable searchPlaceholder={t('Search_Users')} header={header} renderRow={renderRow} data={data} setParams={setParams} />;
}
