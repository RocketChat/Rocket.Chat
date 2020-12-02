import { Box, Table, Icon, TextInput, Field, CheckBox, Margins } from '@rocket.chat/fuselage';
import { useMediaQuery, useUniqueId, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState, useEffect } from 'react';

import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { roomTypes } from '../../../../app/utils/client';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { useRoute } from '../../../contexts/RouterContext';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

export const DEFAULT_TYPES = ['d', 'p', 'c'];

export const roomTypeI18nMap = {
	l: 'Omnichannel',
	c: 'Channel',
	d: 'Direct',
	p: 'Group',
	discussion: 'Discussion',
};

const FilterByTypeAndText = ({ setFilter, ...props }) => {
	const [text, setText] = useState('');
	const [types, setTypes] = useState({ d: false, c: false, p: false, l: false, discussions: false });

	const t = useTranslation();

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);
	const handleCheckBox = useCallback((type) => setTypes({ ...types, [type]: !types[type] }), [types]);

	useEffect(() => {
		if (Object.values(types).filter(Boolean).length === 0) {
			return setFilter({ text, types: DEFAULT_TYPES });
		}
		const _types = Object.entries(types).filter(([, value]) => Boolean(value)).map(([key]) => key);
		setFilter({ text, types: _types });
	}, [setFilter, text, types]);

	const idDirect = useUniqueId();
	const idDPublic = useUniqueId();
	const idPrivate = useUniqueId();
	const idOmnichannel = useUniqueId();
	const idDiscussions = useUniqueId();

	return <Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput flexShrink={0} placeholder={t('Search_Rooms')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
		<Field>
			<Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start' mbs='x8' mi='neg-x8'>
				<Margins inline='x8'>
					<Field.Row>
						<CheckBox checked={types.d} id={idDirect} onChange={() => handleCheckBox('d')}/>
						<Field.Label htmlFor={idDirect} >{t('Direct')}</Field.Label>
					</Field.Row>
					<Field.Row>
						<CheckBox checked={types.c} id={idDPublic} onChange={() => handleCheckBox('c')}/>
						<Field.Label htmlFor={idDPublic}>{t('Public')}</Field.Label>
					</Field.Row>
					<Field.Row>
						<CheckBox checked={types.p} id={idPrivate} onChange={() => handleCheckBox('p')}/>
						<Field.Label htmlFor={idPrivate}>{t('Private')}</Field.Label>
					</Field.Row>
					<Field.Row>
						<CheckBox checked={types.l} id={idOmnichannel} onChange={() => handleCheckBox('l')}/>
						<Field.Label htmlFor={idOmnichannel}>{t('Omnichannel')}</Field.Label>
					</Field.Row>
					<Field.Row>
						<CheckBox checked={types.discussions} id={idDiscussions} onChange={() => handleCheckBox('discussions')}/>
						<Field.Label htmlFor={idDiscussions}>{t('Discussions')}</Field.Label>
					</Field.Row>
				</Margins>
			</Box>
		</Field>
	</Box>;
};

const useQuery = ({ text, types, itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	filter: text || '',
	types,
	sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, types, itemsPerPage, current, column, direction]);

function RoomsTable() {
	const t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const [params, setParams] = useState({ text: '', types: DEFAULT_TYPES, current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const routeName = 'admin-rooms';

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort);

	const { value: data = {} } = useEndpointData('rooms.adminRooms', query);

	const router = useRoute(routeName);

	const onClick = useCallback((rid) => () => router.push({
		context: 'edit',
		id: rid,
	}), [router]);

	const onHeaderClick = useCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	if (sort[0] === 'name' && data.rooms) {
		data.rooms = data.rooms.sort((a, b) => {
			const aName = a.type === 'd' ? a.usernames.join(' x ') : roomTypes.getRoomName(a.t, a);
			const bName = b.type === 'd' ? b.usernames.join(' x ') : roomTypes.getRoomName(b.t, b);
			if (aName === bName) { return 0; }
			const result = aName < bName ? -1 : 1;
			return sort[1] === 'asc' ? result : result * -1;
		});
	}

	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'type'} direction={sort[1]} active={sort[0] === 't'} onClick={onHeaderClick} sort='t' w='x100'>{t('Type')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'users'} direction={sort[1]} active={sort[0] === 'usersCount'} onClick={onHeaderClick} sort='usersCount' w='x80'>{t('Users')}</GenericTable.HeaderCell>,
		mediaQuery && <GenericTable.HeaderCell key={'messages'} direction={sort[1]} active={sort[0] === 'msgs'} onClick={onHeaderClick} sort='msgs' w='x80'>{t('Msgs')}</GenericTable.HeaderCell>,
		mediaQuery && <GenericTable.HeaderCell key={'default'} direction={sort[1]} active={sort[0] === 'default'} onClick={onHeaderClick} sort='default' w='x80' >{t('Default')}</GenericTable.HeaderCell>,
		mediaQuery && <GenericTable.HeaderCell key={'featured'} direction={sort[1]} active={sort[0] === 'featured'} onClick={onHeaderClick} sort='featured' w='x80'>{t('Featured')}</GenericTable.HeaderCell>,
	].filter(Boolean), [sort, onHeaderClick, t, mediaQuery]);

	const renderRow = useCallback(({ _id, name, t: type, usersCount, msgs, default: isDefault, featured, usernames, ...args }) => {
		const icon = roomTypes.getIcon({ t: type, usernames, ...args });
		const roomName = type === 'd' ? usernames.join(' x ') : roomTypes.getRoomName(type, { name, type, _id, ...args });

		return <Table.Row action key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link'qa-room-id={_id}>
			<Table.Cell style={style}>
				<Box display='flex' alignContent='center'>
					<RoomAvatar size={mediaQuery ? 'x28' : 'x40'} room={{ type, name: roomName, _id, ...args }} />
					<Box display='flex' style={style} mi='x8'>
						<Box display='flex' flexDirection='row' alignSelf='center' alignItems='center' style={style}>
							<Icon mi='x2' name={icon === 'omnichannel' ? 'livechat' : icon} fontScale='p2' color='hint'/><Box fontScale='p2' style={style} color='default'>{roomName}</Box>
						</Box>
					</Box>
				</Box>
			</Table.Cell>
			<Table.Cell>
				<Box color='hint' fontScale='p2' style={style}>{ t(roomTypeI18nMap[type]) }</Box>
				<Box mi='x4'/>
			</Table.Cell>
			<Table.Cell style={style}>{usersCount}</Table.Cell>
			{mediaQuery && <Table.Cell style={style}>{msgs}</Table.Cell>}
			{mediaQuery && <Table.Cell style={style}>{isDefault ? t('True') : t('False')}</Table.Cell>}
			{mediaQuery && <Table.Cell style={style}>{featured ? t('True') : t('False')}</Table.Cell>}
		</Table.Row>;
	}, [mediaQuery, onClick, t]);

	return <GenericTable
		header={header}
		renderRow={renderRow}
		results={data.rooms}
		total={data.total}
		setParams={setParams}
		params={params}
		renderFilter={({ onChange, ...props }) => <FilterByTypeAndText setFilter={onChange} {...props} />}
	/>;
}

export default RoomsTable;
