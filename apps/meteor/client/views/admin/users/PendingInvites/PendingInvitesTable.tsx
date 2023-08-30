import { type IRole, type IUser, UserStatus as Status } from '@rocket.chat/core-typings';
import { Box, Pagination } from '@rocket.chat/fuselage';
import { useMediaQuery, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { OptionProp } from '@rocket.chat/ui-client';
import { useEndpoint, useToastMessageDispatch, useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { escapeRegExp } from 'lodash';
import type { CSSProperties, MutableRefObject, ReactElement } from 'react';
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';

import { Roles } from '../../../../../app/models/client';
import FilterByText from '../../../../components/FilterByText';
import GenericNoResults from '../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import { UserStatus } from '../../../../components/UserStatus';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import UsersTableRow from '../UsersTable/UsersTableRow';

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

	const { data, refetch, isSuccess, isLoading, error } = useQuery(
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
		() =>
			[
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
				<GenericTableHeaderCell
					w='x100'
					key='action'
					direction={sortDirection}
					active={sortBy === 'action'}
					onClick={setSort}
					sort='action'
				>
					{t('Pending_action')}
				</GenericTableHeaderCell>,
			].filter(Boolean),
		[mediaQuery, setSort, sortBy, sortDirection, t],
	);

	if (error) {
		throw error;
	}

	const renderRow = useCallback(
		(user: IUser) => {
			const { _id, emails, username, name, status, roles, avatarETag } = user;

			// TODO: create a function to get user pending actions!
			const pendingAction = getPendingAction(user);

			const roleNames = (roles || [])
				.map((roleId) => (Roles.findOne(roleId, { fields: { name: 1 } }) as IRole | undefined)?.name)
				.filter((roleName): roleName is string => !!roleName)
				.join(', ');

			return (
				<GenericTableRow action key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' qa-room-id={_id}>
					<GenericTableCell withTruncatedText>
						<Box display='flex' alignItems='center'>
							{username && <UserAvatar size={mediaQuery ? 'x28' : 'x40'} username={username} etag={avatarETag} />}
							<Box display='flex' mi={8} withTruncatedText>
								<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
									<Box fontScale='p2m' color='default' withTruncatedText>
										<Box display='inline' mie='x8'>
											<UserStatus status={status || Status.OFFLINE} />
										</Box>
										{name || username}
									</Box>
									{!mediaQuery && name && (
										<Box fontScale='p2' color='hint' withTruncatedText>
											{`@${username}`}
										</Box>
									)}
								</Box>
							</Box>
						</Box>
					</GenericTableCell>
					{mediaQuery && (
						<GenericTableCell>
							<Box fontScale='p2m' color='hint' withTruncatedText>
								{username}
							</Box>
							<Box mi={4} />
						</GenericTableCell>
					)}

					<GenericTableCell withTruncatedText>{emails?.length && emails[0].address}</GenericTableCell>

					{mediaQuery && <GenericTableCell withTruncatedText>{roleNames}</GenericTableCell>}

					<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
						{pendingAction}
					</GenericTableCell>
				</GenericTableRow>
			);
		},
		[mediaQuery, onClick],
	);

	// TODO: create hook useFilteredUserRoles and PendingInvitesTableFilters
	const usersList = useFilteredUserRoles(rolesFilters.roles, isLoading, data?.users);

	return (
		<>
			<PendingInvitesTableFilters setFilters={setRolesFilters} />

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
								<UsersTableRow key={user._id} onClick={onClick} mediaQuery={mediaQuery} user={user} />
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
