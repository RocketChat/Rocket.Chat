import { Box, Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';

import UserAvatar from '../../../components/avatar/UserAvatar';
import GenericTable from '../../../components/GenericTable';
import { capitalize } from '../../../lib/capitalize';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import FilterByText from '../../../components/FilterByText';

const style = {
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
	overflow: 'hidden',
};

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const UserRow = ({ emails, _id, username, name, roles, status, avatarETag, onClick, mediaQuery, active }) => {
	const t = useTranslation();

	const statusText = active ? t(capitalize(status)) : t('Disabled');
	return <Table.Row onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' action qa-user-id={_id}>
		<Table.Cell style={style}>
			<Box display='flex' alignItems='center'>
				<UserAvatar size={mediaQuery ? 'x28' : 'x40'} title={username} username={username} etag={avatarETag}/>
				<Box display='flex' style={style} mi='x8'>
					<Box display='flex' flexDirection='column' alignSelf='center' style={style}>
						<Box fontScale='p2' style={style} color='default'>{name || username}</Box>
						{!mediaQuery && name && <Box fontScale='p1' color='hint' style={style}> {`@${ username }`} </Box>}
					</Box>
				</Box>
			</Box>
		</Table.Cell>
		{mediaQuery && <Table.Cell>
			<Box fontScale='p2' style={style} color='hint'>{ username }</Box> <Box mi='x4'/>
		</Table.Cell>}
		<Table.Cell style={style}>{emails && emails.length && emails[0].address}</Table.Cell>
		{mediaQuery && <Table.Cell style={style}>{roles && roles.join(', ')}</Table.Cell>}
		<Table.Cell fontScale='p1' color='hint' style={style}>{statusText}</Table.Cell>
	</Table.Row>;
};


const useQuery = ({ text, itemsPerPage, current }, sortFields) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, emails: 1, roles: 1, status: 1, avatarETag: 1, active: 1 }),
	query: JSON.stringify({
		$or: [
			{ 'emails.address': { $regex: text || '', $options: 'i' } },
			{ username: { $regex: text || '', $options: 'i' } },
			{ name: { $regex: text || '', $options: 'i' } },
		],
	}),
	sort: JSON.stringify(sortFields.reduce((agg, [column, direction]) => {
		agg[column] = sortDir(direction);
		return agg;
	}, {})),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, itemsPerPage, current, sortFields]);

export function UsersTable() {
	const t = useTranslation();

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState([['name', 'asc'], ['usernames', 'asc']]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);

	const { value: data = {} } = useEndpointData('users.list', query);

	const usersRoute = useRoute('admin-users');

	const onClick = useCallback((username) => () => usersRoute.push({
		context: 'info',
		id: username,
	}), [usersRoute]);

	const onHeaderClick = useCallback((id) => {
		const preparedSort = [];

		const [[sortBy, sortDirection]] = sort;

		if (sortBy === id) {
			preparedSort.push([id, sortDirection === 'asc' ? 'desc' : 'asc']);
		} else {
			preparedSort.push([id, 'asc']);
		}

		//
		// Special cases

		// If the sortable field is `name`, we should also add `usernames`
		if (id === 'name') {
			preparedSort.push(['usernames', sortDirection]);
		}

		// If the sortable field is `name`, we should also add `usernames`
		if (id === 'status') {
			preparedSort.push(['active', sortDirection === 'asc' ? 'desc' : 'asc']);
		}

		setSort(preparedSort);
	}, [sort]);

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	return <GenericTable
		header={<>
			<GenericTable.HeaderCell key={'name'} direction={sort[0][1]} active={sort[0][0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>
				{t('Name')}
			</GenericTable.HeaderCell>
			{mediaQuery && <GenericTable.HeaderCell key={'username'} direction={sort[0][1]} active={sort[0][0] === 'username'} onClick={onHeaderClick} sort='username' w='x140'>
				{t('Username')}
			</GenericTable.HeaderCell>}
			<GenericTable.HeaderCell key={'email'} direction={sort[0][1]} active={sort[0][0] === 'emails.adress'} onClick={onHeaderClick} sort='emails.address' w='x120'>
				{t('Email')}
			</GenericTable.HeaderCell>
			{mediaQuery && <GenericTable.HeaderCell key={'roles'} direction={sort[0][1]} active={sort[0][0] === 'roles'} onClick={onHeaderClick} sort='roles' w='x120'>
				{t('Roles')}
			</GenericTable.HeaderCell>}
			<GenericTable.HeaderCell key={'status'} direction={sort[0][1]} active={sort[0][0] === 'status'} onClick={onHeaderClick} sort='status' w='x100'>
				{t('Status')}
			</GenericTable.HeaderCell>
		</>}
		results={data.users}
		total={data.total}
		setParams={setParams}
		params={params}
		renderFilter={({ onChange, ...props }) => <FilterByText placeholder={t('Search_Users')} onChange={onChange} {...props} />}
	>
		{(props) => <UserRow key={props._id} onClick={onClick} mediaQuery={mediaQuery} {...props}/>}
	</GenericTable>;
}

export default UsersTable;
