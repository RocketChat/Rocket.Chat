import React, { useMemo, useCallback } from 'react';
import { Box, Table, Avatar, Icon } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { DirectoryTable, Th } from '../../../../ui/client/views/app/components/Directory/DirectoryTable';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

const roomTypeIconNameMap = {
	l: 'livechat',
	c: 'hashtag',
	d: 'at',
	p: 'lock',
	discussion: 'discussion',
};

const roomTypeI18nMap = {
	l: 'Livechat',
	c: 'Channel',
	d: 'Direct',
	p: 'Group',
	discussion: 'Discussion',
};

export function RoomsTab({
	sort,
	data,
	onHeaderClick,
	onClick,
	setParams,
}) {
	const t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</Th>,
		<Th key={'type'} direction={sort[1]} active={sort[0] === 't'} onClick={onHeaderClick} sort='t' w='x100'>{t('Type')}</Th>,
		<Th key={'users'} direction={sort[1]} active={sort[0] === 'usersCount'} onClick={onHeaderClick} sort='usersCount' w='x80'>{t('Users')}</Th>,
		mediaQuery && <Th key={'messages'} direction={sort[1]} active={sort[0] === 'msgs'} onClick={onHeaderClick} sort='msgs' w='x80'>{t('Msgs')}</Th>,
		mediaQuery && <Th key={'default'} direction={sort[1]} active={sort[0] === 'default'} onClick={onHeaderClick} sort='default' w='x80' >{t('Default')}</Th>,
		mediaQuery && <Th key={'featured'} direction={sort[1]} active={sort[0] === 'featured'} onClick={onHeaderClick} sort='featured' w='x80'>{t('Featured')}</Th>,
	].filter(Boolean), [sort, mediaQuery]);

	const renderRow = useCallback(({ _id, name, t: type, usersCount, msgs, default: isDefault, featured, usernames }) => {
		const roomName = name || usernames.join(' x ');
		const avatarUrl = name || usernames[0];
		return <Table.Row key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' action>
			<Table.Cell style={style}>
				<Box display='flex' alignContent='center'>
					<Avatar size={mediaQuery ? 'x28' : 'x40'} title={avatarUrl} url={avatarUrl} />
					<Box display='flex' style={style} mi='x8'>
						<Box display='flex' flexDirection='row' alignSelf='center' alignItems='center' style={style}>
							<Icon mi='x2' name={roomTypeIconNameMap[type]} textStyle='p2' textColor='hint'/><Box textStyle='p2' style={style} textColor='default'>{roomName}</Box>
						</Box>
					</Box>
				</Box>
			</Table.Cell>
			<Table.Cell>
				<Box textStyle='p2' style={style} textColor='default'>{ t(roomTypeI18nMap[type]) }</Box> <Box mi='x4'/>
			</Table.Cell>
			<Table.Cell style={style}>{usersCount}</Table.Cell>
			{mediaQuery && <Table.Cell style={style}>{msgs}</Table.Cell>}
			{mediaQuery && <Table.Cell style={style}>{isDefault ? t('True') : t('False')}</Table.Cell>}
			{mediaQuery && <Table.Cell style={style}>{featured ? t('True') : t('False')}</Table.Cell>}
		</Table.Row>;
	}, [mediaQuery]);

	return <DirectoryTable searchPlaceholder={t('Search_Rooms')} header={header} renderRow={renderRow} results={data.rooms} total={data.total} setParams={setParams} />;
}
