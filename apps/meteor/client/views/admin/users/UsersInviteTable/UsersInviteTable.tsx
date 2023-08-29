import type { IInvite } from '@rocket.chat/core-typings';
import { Box, Pagination, style } from '@rocket.chat/fuselage';
import { useMediaQuery, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { Users } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { OptionProp } from '@rocket.chat/ui-client';
import { useEndpoint, useRouter, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, MutableRefObject } from 'react';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import GenericNoResults from '../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
	GenericTableCell,
	GenericTableRow,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import UsersInviteTableFilters from './UsersInviteTableFilters';
import { useFilteredStatusInvites } from './useFilteredStatusInvites';
import { useFilteredTypesInvites } from './useFilteredTypesInvites';

type InviteFilters = {
	searchText: string;
	status: OptionProp[];
	types: OptionProp[];
};
// TODO: create functions to find user informations about: Invite type; Email; Date; Invite status; Usage allowance!

const UsersInviteTable = ({ reload }: { reload: MutableRefObject<() => void> }): ReactElement => {
	const t = useTranslation();
	const router = useRouter();

	const mediaQuery = useMediaQuery('(min-width: 1024px)');
	const [inviteFilters, setInviteFilters] = useState<InviteFilters>({ searchText: '', status: [], types: [] });

	const prevInviteFilterText = useRef<string>(inviteFilters.searchText);

	// TODO: check if sorters are working: 'Invite type | Email | Date | Invite status | Usage allowance'
	const { sortBy, sortDirection, setSort } = useSort<'type' | 'emails.address' | 'date' | 'inviteStatus' | 'usage'>('type');
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const searchText = useDebouncedValue(inviteFilters.searchText, 500);

	const query = useDebouncedValue(
		useMemo(() => {
			if (searchText !== prevInviteFilterText.current) {
				setCurrent(0);
			}

			// TODO: fix this and check if it's working!
			return {
				filter: searchText || '',
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: searchText === prevInviteFilterText.current ? current : 0,
				query: JSON.stringify({
					$or: [
						{ 'emails.address': { $regex: escapeRegExp(searchText), $options: 'i' } },
						{ username: { $regex: escapeRegExp(searchText), $options: 'i' } },
						{ name: { $regex: escapeRegExp(searchText), $options: 'i' } },
					],
				}),
			};
		}, [searchText, sortBy, sortDirection, itemsPerPage, current, setCurrent]),
		500,
	);

	const getInvites = useEndpoint('GET', '/v1/listInvites');

	const dispatchToastMessage = useToastMessageDispatch();

	const { data, isLoading, error, isSuccess, refetch } = useQuery(
		['invites', query],
		async () => {
			const results = await getInvites(query);

			// The result from the API uses strings for dates, so we need to change that. Also, there's an extra prop `updatedAt`, which doesn't exist on IInvite.
			const invites: IInvite[] = results.map(
				({ _updatedAt, createdAt, expires, ...args }: { _updatedAt: string; createdAt: string; expires: string; args: any }) => {
					return {
						...args,
						createdAt: new Date(createdAt),
						expires: expires !== null ? new Date(expires) : null,
					};
				},
			);

			return invites;
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

	const handleClick = useCallback(
		(id): void =>
			router.navigate({
				name: 'admin-users',
				params: {
					context: 'info',
					id,
				},
			}),
		[router],
	);

	const headers = useMemo(
		() => [
			mediaQuery && (
				<GenericTableHeaderCell w='x200' key='name' direction={sortDirection} active={sortBy === 'type'} onClick={setSort} sort='type'>
					{t('Invite_type')}
				</GenericTableHeaderCell>
			),

			mediaQuery && (
				<GenericTableHeaderCell
					w='x140'
					key='email'
					direction={sortDirection}
					active={sortBy === 'emails.address'}
					onClick={setSort}
					sort='emails.address'
				>
					{t('Email')}
				</GenericTableHeaderCell>
			),

			mediaQuery && (
				<GenericTableHeaderCell w='x120' key='date' direction={sortDirection} active={sortBy === 'date'} onClick={setSort} sort='date'>
					{t('Date')}
				</GenericTableHeaderCell>
			),

			mediaQuery && (
				<GenericTableHeaderCell
					w='x100'
					key='inviteStatus'
					direction={sortDirection}
					active={sortBy === 'inviteStatus'}
					onClick={setSort}
					sort='inviteStatus'
				>
					{t('Invite_status')}
				</GenericTableHeaderCell>
			),

			mediaQuery && (
				<GenericTableHeaderCell w='x100' key='usage' direction={sortDirection} active={sortBy === 'usage'} onClick={setSort} sort='usage'>
					{t('Usage_allowance')}
				</GenericTableHeaderCell>
			),
		],
		[mediaQuery, setSort, sortBy, sortDirection, t],
	);

	function intersectArraysWithoutDuplicates(array1: IInvite[], array2: IInvite[]) {
		const set2 = new Set(array2);

		return [...new Set(array1)].filter((item) => set2.has(item));
	}

	const inviteStatusList = useFilteredStatusInvites(inviteFilters.status, isLoading, data);
	const inviteTypesList = useFilteredTypesInvites(inviteFilters.types, isLoading, data);

	const invitesList = intersectArraysWithoutDuplicates(inviteStatusList, inviteTypesList);

	if (error) {
		throw error;
	}

	const renderRow = useCallback(
		async (invite: IInvite) => {
			const { userId, createdAt } = invite;

			const user = await Users.findOneById(userId);

			if (!user) {
				throw new Error('Could not find user');
			}

			const getInviteType = (invite: IInvite): 'Email' | 'Link' => {
				// TODO: is this correct? How to check the invite type?
				if (invite.url) return 'Link';
				return 'Email';
			};

			const getInviteStatus = (invite: IInvite): 'Pending' | 'Accepted' | 'Expired' => {
				const isExpired = (expires: IInvite['expires']): boolean => {
					if (expires && expires.getTime() < new Date().getTime()) {
						return true;
					}
					return false;
				};

				if (isExpired(invite.expires)) return 'Expired';

				// TODO: how to check if the invite was accepted or is still pending?
				return 'Accepted';
			};

			const getUsageAllowance = ({ maxUses, uses }: IInvite) => {
				if (maxUses > 0) return `${uses} / ${maxUses}`;

				return `${uses} / ${t('Unlimited')}`;
			};

			return (
				<GenericTableRow
					action
					key={userId}
					onKeyDown={handleClick(userId) as any}
					onClick={handleClick(userId) as any}
					tabIndex={0}
					role='link'
					qa-room-id={userId}
				>
					<GenericTableCell>
						<Box color='hint' fontScale='p2m' style={style}>
							{t(getInviteType(invite))}
						</Box>
						<Box mi={4} />
					</GenericTableCell>
					<GenericTableCell>
						<Box color='hint' fontScale='p2m' style={style}>
							{user.emails?.length ? user.emails[0] : '-'}
						</Box>
						<Box mi='x4' />
					</GenericTableCell>
					{mediaQuery && <GenericTableCell style={style}>{createdAt}</GenericTableCell>}
					{mediaQuery && <GenericTableCell style={style}>{getInviteStatus(invite)}</GenericTableCell>}
					<GenericTableCell style={style}>{getUsageAllowance(invite)}</GenericTableCell>
				</GenericTableRow>
			);
		},
		[mediaQuery, handleClick, t],
	);

	// TODO: add filter functions here and create a single filtered invites list!

	return (
		<>
			<UsersInviteTableFilters setFilters={setInviteFilters} />

			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>{isLoading && <GenericTableLoadingTable headerCells={5} />}</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data && data.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>{isSuccess && invitesList?.map((invite: IInvite) => renderRow(invite))}</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.length || 0}
						// count={data?.total || 0}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{isSuccess && data?.length === 0 && <GenericNoResults />}
		</>
	);
};

export default UsersInviteTable;
