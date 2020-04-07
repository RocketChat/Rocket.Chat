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

export function RoomsTab({
	workspace = 'local',
}) {
	const [params, setParams] = useState({});
	const [sort, setSort] = useState(['name', 'asc']);

	// const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');

	const t = useTranslation();

	// const federation = workspace === 'external';

	const query = useQuery(params, sort, 'rooms', workspace);

	const mediaQuery = useMediaQuery('(min-width: 700px)');

	const go = useRoute('direct');

	const data = useEndpointData('GET', 'directory', query) || {};

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
		<Th key={'type'} direction={sort[1]} active={sort[0] === 'type'} onClick={onHeaderClick} sort='type' w='x100'>{t('Type')}</Th>,
		<Th key={'users'} direction={sort[1]} active={sort[0] === 'users'} onClick={onHeaderClick} sort='users' w='x80'>{t('Users')}</Th>,
		mediaQuery && <Th key={'messages'} direction={sort[1]} active={sort[0] === 'messages'} onClick={onHeaderClick} sort='messages' w='x80'>{t('Msgs')}</Th>,
		mediaQuery && <Th key={'default'} direction={sort[1]} active={sort[0] === 'default'} onClick={onHeaderClick} sort='default' w='x40' >{t('Default')}</Th>,
		mediaQuery && <Th key={'featured'} direction={sort[1]} active={sort[0] === 'featured'} onClick={onHeaderClick} sort='featured' w='x40'>{t('Featured')}</Th>,
	].filter(Boolean), [sort, mediaQuery]);

	const renderRow = useCallback(({ _id, name, type, users, messages, deafault, featured }) => <Table.Row key={_id} onKeyDown={onClick(name)} onClick={onClick(name)} tabIndex={0} role='link' action>
		<Table.Cell style={style}>
			<Flex.Container>
				<Box>
					<Avatar size='x40' title={name} url={name} />
					<Box display='flex' style={style} mi='x8'>
						<Box display='flex' flexDirection='column' alignSelf='center' style={style}>
							<Box textStyle='p2' style={style} textColor='default'>{name}</Box>
						</Box>
					</Box>
				</Box>
			</Flex.Container>
		</Table.Cell>
		<Table.Cell>
			<Box textStyle='p2' style={style} textColor='default'>{ type }</Box> <Box mi='x4'/>
		</Table.Cell>
		<Table.Cell style={style}>{users}</Table.Cell>
		{mediaQuery && <Table.Cell style={style}>{messages}</Table.Cell>}
		{mediaQuery && <Table.Cell style={style}>{deafault ? t('True') : t('False')}</Table.Cell>}
		{mediaQuery && <Table.Cell style={style}>{featured ? t('True') : t('False')}</Table.Cell>}
	</Table.Row>, [mediaQuery]);

	console.log(data);

	return <DirectoryTable searchPlaceholder={t('Search_Rooms')} header={header} renderRow={renderRow} data={data} setParams={setParams} />;
}
