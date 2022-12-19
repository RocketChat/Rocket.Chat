import { States, StatesIcon, StatesTitle, Pagination } from '@rocket.chat/fuselage';
import { useMediaQuery, useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, MutableRefObject } from 'react';
import React, { useMemo, useState, useEffect } from 'react';

import FilterByText from '../../../../components/FilterByText';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import UsersTableRow from './UsersTableRow';

type UsersTableProps = {
	reload: MutableRefObject<() => void>;
};

const UsersTable = ({ reload }: UsersTableProps): ReactElement | null => {
	const t = useTranslation();
	const usersRoute = useRoute('admin-users');
	const mediaQuery = useMediaQuery('(min-width: 1024px)');
	const [text, setText] = useState('');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'username' | 'emails.address' | 'status'>('name');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				fields: JSON.stringify({
					name: 1,
					username: 1,
					emails: 1,
					roles: 1,
					status: 1,
					avatarETag: 1,
					active: 1,
				}),
				query: JSON.stringify({
					$or: [
						{ 'emails.address': { $regex: text || '', $options: 'i' } },
						{ username: { $regex: text || '', $options: 'i' } },
						{ name: { $regex: text || '', $options: 'i' } },
					],
				}),
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: current,
			}),
			[text, itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const { value, phase, reload: reloadList } = useEndpointData('/v1/users.list', query);

	useEffect(() => {
		reload.current = reloadList;
	}, [reload, reloadList]);

	const handleClick = useMutableCallback((id): void =>
		usersRoute.push({
			context: 'info',
			id,
		}),
	);

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell w='x200' key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>,
			mediaQuery && (
				<GenericTableHeaderCell
					w='x140'
					key='username'
					direction={sortDirection}
					active={sortBy === 'username'}
					onClick={setSort}
					sort='username'
				>
					{t('Username')}
				</GenericTableHeaderCell>
			),
			<GenericTableHeaderCell
				w='x120'
				key='email'
				direction={sortDirection}
				active={sortBy === 'emails.address'}
				onClick={setSort}
				sort='emails.address'
			>
				{t('Email')}
			</GenericTableHeaderCell>,
			mediaQuery && (
				<GenericTableHeaderCell w='x120' key='roles' onClick={setSort}>
					{t('Roles')}
				</GenericTableHeaderCell>
			),
			<GenericTableHeaderCell w='x100' key='status' direction={sortDirection} active={sortBy === 'status'} onClick={setSort} sort='status'>
				{t('Status')}
			</GenericTableHeaderCell>,
		],
		[mediaQuery, setSort, sortBy, sortDirection, t],
	);

	if (phase === AsyncStatePhase.REJECTED) {
		return null;
	}

	return (
		<>
			<FilterByText placeholder={t('Search_Users')} onChange={({ text }): void => setText(text)} />
			{phase === AsyncStatePhase.LOADING && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>{phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={5} />}</GenericTableBody>
				</GenericTable>
			)}
			{value?.users && value.users.length > 0 && phase === AsyncStatePhase.RESOLVED && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{value?.users.map((user) => (
								<UsersTableRow key={user._id} onClick={handleClick} mediaQuery={mediaQuery} user={user} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={value?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{phase === AsyncStatePhase.RESOLVED && value?.users.length === 0 && (
				<States>
					<StatesIcon name='magnifier' />
					<StatesTitle>{t('No_results_found')}</StatesTitle>
				</States>
			)}
		</>
	);
};

export default UsersTable;
