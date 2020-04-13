import React, { useMemo, useCallback } from 'react';
import { Box, Table, Flex, Avatar } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

// import { useEndpointData } from '../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { DirectoryTable, Th } from '../../../../ui/client/views/app/components/Directory/DirectoryTable';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
// import { useRoute } from '../../../../../client/contexts/RouterContext';
// import { usePermission } from '../../../contexts/AuthorizationContext';
// import { useQuery } from '../../../../ui/client/views/app/components/hooks';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

export function RoomsTab({
	sort,
	data,
	onHeaderClick,
	onClick,
	setParams,
}) {
	const t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 700px)');

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</Th>,
		<Th key={'type'} direction={sort[1]} active={sort[0] === 'type'} onClick={onHeaderClick} sort='type' w='x100'>{t('Type')}</Th>,
		<Th key={'users'} direction={sort[1]} active={sort[0] === 'users'} onClick={onHeaderClick} sort='users' w='x80'>{t('Users')}</Th>,
		mediaQuery && <Th key={'messages'} direction={sort[1]} active={sort[0] === 'messages'} onClick={onHeaderClick} sort='messages' w='x80'>{t('Msgs')}</Th>,
		mediaQuery && <Th key={'default'} direction={sort[1]} active={sort[0] === 'default'} onClick={onHeaderClick} sort='default' w='x40' >{t('Default')}</Th>,
		mediaQuery && <Th key={'featured'} direction={sort[1]} active={sort[0] === 'featured'} onClick={onHeaderClick} sort='featured' w='x40'>{t('Featured')}</Th>,
	].filter(Boolean), [sort, mediaQuery]);

	const renderRow = useCallback(({ _id, name, t: type, usersCount, msgs, default: isDefault, featured, usernames }) => {
		const roomName = name || usernames.join(' x ');
		const avatarUrl = name || usernames[0];
		return <Table.Row key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' action>
			<Table.Cell style={style}>
				<Flex.Container>
					<Box>
						<Avatar size='x40' title={avatarUrl} url={avatarUrl} />
						<Box display='flex' style={style} mi='x8'>
							<Box display='flex' flexDirection='column' alignSelf='center' style={style}>
								<Box textStyle='p2' style={style} textColor='default'>{roomName}</Box>
							</Box>
						</Box>
					</Box>
				</Flex.Container>
			</Table.Cell>
			<Table.Cell>
				<Box textStyle='p2' style={style} textColor='default'>{ type }</Box> <Box mi='x4'/>
			</Table.Cell>
			<Table.Cell style={style}>{usersCount}</Table.Cell>
			{mediaQuery && <Table.Cell style={style}>{msgs}</Table.Cell>}
			{mediaQuery && <Table.Cell style={style}>{isDefault ? t('True') : t('False')}</Table.Cell>}
			{mediaQuery && <Table.Cell style={style}>{featured ? t('True') : t('False')}</Table.Cell>}
		</Table.Row>;
	}, [mediaQuery]);

	console.log(data);

	return <DirectoryTable searchPlaceholder={t('Search_Rooms')} header={header} renderRow={renderRow} results={data.rooms} total={data.total} setParams={setParams} />;
}
