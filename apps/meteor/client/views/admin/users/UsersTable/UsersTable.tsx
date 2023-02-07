import { States, StatesIcon, StatesTitle, Pagination } from '@rocket.chat/fuselage';
import { useMediaQuery, useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRoute, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
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

	const getUsers = useEndpoint('GET', '/v1/users.list');

	const dispatchToastMessage = useToastMessageDispatch();

	const { data, isLoading, error, isSuccess, refetch } = useQuery(
		['users', query],
		async () => {
			const users = await getUsers(query);
			return users;
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

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

	if (error) {
		return null;
	}

	return (
		<>
			<FilterByText autoFocus placeholder={t('Search_Users')} onChange={({ text }): void => setText(text)} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>{isLoading && <GenericTableLoadingTable headerCells={5} />}</GenericTableBody>
				</GenericTable>
			)}
			{data?.users && data.count > 0 && isSuccess && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.users.map((user) => (
								<UsersTableRow key={user._id} onClick={handleClick} mediaQuery={mediaQuery} user={user} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{isSuccess && data?.count === 0 && (
				<States>
					<StatesIcon name='magnifier' />
					<StatesTitle>{t('No_results_found')}</StatesTitle>
				</States>
			)}
		</>
	);
};

export default UsersTable;
