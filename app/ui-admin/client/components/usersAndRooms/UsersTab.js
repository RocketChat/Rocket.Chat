import React, { useMemo, useCallback } from 'react';
import { Box, Table, Flex, Avatar } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { DirectoryTable, Th } from '../../../../ui/client/views/app/components/Directory/DirectoryTable';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

export function UsersTab({
	// workspace = 'local',
	data,
	sort,
	onClick,
	onHeaderClick,
	setParams,
}) {
	const t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</Th>,
		mediaQuery && <Th key={'username'} direction={sort[1]} active={sort[0] === 'username'} onClick={onHeaderClick} sort='username' w='x140'>{t('Username')}</Th>,
		<Th key={'email'} direction={sort[1]} active={sort[0] === 'emails.adress'} onClick={onHeaderClick} sort='emails.address' w='x120'>{t('Email')}</Th>,
		mediaQuery && <Th key={'roles'} direction={sort[1]} active={sort[0] === 'roles'} onClick={onHeaderClick} sort='roles' w='x120'>{t('Roles')}</Th>,
		<Th key={'status'} direction={sort[1]} active={sort[0] === 'status'} onClick={onHeaderClick} sort='status' w='x100'>{t('Status')}</Th>,
	].filter(Boolean), [sort, mediaQuery]);

	const renderRow = useCallback(({ emails, _id, username, name, roles, status }) => <Table.Row key={_id} onKeyDown={onClick(username)} onClick={onClick(username)} tabIndex={0} role='link' action>
		<Table.Cell style={style}>
			<Flex.Container>
				<Box>
					<Avatar size='x20' title={username} url={username} />
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
		<Table.Cell textStyle='p1' textColor='hint' style={style}>{status}</Table.Cell>
	</Table.Row>, [mediaQuery]);

	return <DirectoryTable searchPlaceholder={t('Search_Users')} header={header} renderRow={renderRow} results={data.users} total={data.total} setParams={setParams} />;
}
