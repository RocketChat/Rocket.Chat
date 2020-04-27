import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Box, Table, Avatar, TextInput, Icon } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { GenericTable, Th } from '../../../app/ui/client/components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { roomTypes } from '../../../app/utils/client';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

const FilterByText = ({ setFilter, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [text]);
	return <Box mb='x16' is='form' display='flex' flexDirection='column' {...props}>
		<TextInput placeholder={t('Search_Users')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

export function AdminUsers({
	// workspace = 'local',
	data,
	sort,
	onClick,
	onHeaderClick,
	setParams,
	params,
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

	const renderRow = useCallback(({ emails, _id, username, name, roles, status, ...args }) => {
		const avatarUrl = roomTypes.getConfig('d').getAvatarPath({ name: username || name, type: 'd', _id, ...args });

		return <Table.Row key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell style={style}>
				<Box display='flex' alignItems='center'>
					<Avatar size={mediaQuery ? 'x28' : 'x40'} title={username} url={avatarUrl} />
					<Box display='flex' style={style} mi='x8'>
						<Box display='flex' flexDirection='column' alignSelf='center' style={style}>
							<Box textStyle='p2' style={style} textColor='default'>{name || username}</Box>
							{!mediaQuery && name && <Box textStyle='p1' textColor='hint' style={style}> {`@${ username }`} </Box>}
						</Box>
					</Box>
				</Box>
			</Table.Cell>
			{mediaQuery && <Table.Cell>
				<Box textStyle='p2' style={style} textColor='hint'>{ username }</Box> <Box mi='x4'/>
			</Table.Cell>}
			<Table.Cell style={style}>{emails && emails[0].address}</Table.Cell>
			{mediaQuery && <Table.Cell style={style}>{roles && roles.join(', ')}</Table.Cell>}
			<Table.Cell textStyle='p1' textColor='hint' style={style}>{status}</Table.Cell>
		</Table.Row>;
	}, [mediaQuery]);

	return <GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data.users} total={data.total} setParams={setParams} params={params} />;
}
