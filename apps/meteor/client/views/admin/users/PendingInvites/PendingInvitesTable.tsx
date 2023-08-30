import { IUser } from '@rocket.chat/core-typings';
import { useMediaQuery, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { OptionProp } from '@rocket.chat/ui-client';
import { useEndpoint, useToastMessageDispatch, useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { escapeRegExp } from 'lodash';
import type { CSSProperties, MutableRefObject, ReactElement } from 'react';
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';

import { GenericTableHeaderCell } from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';

const style: CSSProperties = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

type RolesFilters = {
	searchText: string;
	roles: OptionProp[];
};

// TODO: create function to find user roles and display in the table!

export const PendingInvitesTable = ({ reload }: { reload: MutableRefObject<() => void> }): ReactElement => {
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const t = useTranslation();

	const [rolesFilters, setRolesFilters] = useState<RolesFilters>({ searchText: '', roles: [] });

	const prevInviteFilterText = useRef<string>(rolesFilters.searchText);

	const { sortBy, sortDirection, setSort } = useSort<'name' | 'username' | 'emails.address' | 'action'>('name');

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const searchText = useDebouncedValue(rolesFilters.searchText, 500);

	const query = useDebouncedValue(
		useMemo(() => {
			if (searchText !== prevInviteFilterText.current) {
				setCurrent(0);
			}
			return {
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
						{ 'emails.address': { $regex: escapeRegExp(searchText), $options: 'i' } },
						{ username: { $regex: escapeRegExp(searchText), $options: 'i' } },
						{ name: { $regex: escapeRegExp(searchText), $options: 'i' } },
					],
				}),
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: searchText === prevInviteFilterText.current ? current : 0,
			};
		}, [searchText, sortBy, sortDirection, itemsPerPage, prevInviteFilterText, current, setCurrent]),
		500,
	);

	const getUsers = useEndpoint('GET', '/v1/users.list');

	const dispatchToastMessage = useToastMessageDispatch();

	const { data, refetch, isSuccess, isLoading, isError } = useQuery(
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

	useEffect(() => {
		prevInviteFilterText.current = searchText;
	}, [searchText]);

	const router = useRouter();

	const onClick = useCallback(
		(id) => (): void =>
			router.navigate({
				name: 'admin-users',
				params: {
					context: 'edit',
					id,
				},
			}),
		[router],
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
			<GenericTableHeaderCell w='x100' key='action' direction={sortDirection} active={sortBy === 'action'} onClick={setSort} sort='action'>
				{t('Pending_action')}
			</GenericTableHeaderCell>,
		],
		[mediaQuery, setSort, sortBy, sortDirection, t],
	);

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
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{isSuccess && data?.count === 0 && <GenericNoResults />}
		</>
	);
};
