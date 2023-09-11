import { Pagination } from '@rocket.chat/fuselage';
import { useMediaQuery, useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { OptionProp } from '@rocket.chat/ui-client';
import { MultiSelectCustom } from '@rocket.chat/ui-client';
import { useEndpoint, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, MutableRefObject } from 'react';
import React, { useRef, useMemo, useState, useEffect } from 'react';

import FilterByText from '../../../../components/FilterByText';
import GenericNoResults from '../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import { useFilterActiveUsers } from '../hooks/useFilterActiveUsers';
import { useFilterPendingUsers } from '../hooks/useFilterPendingUsers';
import { useFilterUsersByRole } from '../hooks/useFilterUsersByRole';
import { useListUsers } from '../hooks/useListUsers';
import UsersTableRow from './UsersTableRow';

type UsersTableProps = {
	reload: MutableRefObject<() => void>;
	tab: string;
};

// TODO: Missing error state
const UsersTable = ({ reload, tab }: UsersTableProps): ReactElement | null => {
	const t = useTranslation();
	const usersRoute = useRoute('admin-users');
	const mediaQuery = useMediaQuery('(min-width: 1024px)');
	const getRoles = useEndpoint('GET', '/v1/roles.list');
	const { data: roleData, isSuccess: hasRoleData } = useQuery(['roles'], async () => getRoles());

	const roleFilterStructure = useMemo(
		() =>
			[
				{
					id: 'filter_by_role',
					text: 'Filter_by_role',
					isGroupTitle: true,
				},
				{
					id: 'all',
					text: 'All_roles',
					isGroupTitle: false,
				},
				...((hasRoleData && roleData.roles) || []).map((currentRole) => ({
					id: currentRole._id,
					text: currentRole.name,
					isGroupTitle: false,
				})),
			] as OptionProp[],
		[hasRoleData, roleData?.roles],
	);

	const [text, setText] = useState('');
	const [roleFilterOptions, setRoleFilterOptions] = useState<OptionProp[]>([]);
	const [roleFilterSelectedOptions, setRoleFilterSelectedOptions] = useState<OptionProp[]>([]);

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'username' | 'emails.address' | 'status'>('name');

	const searchTerm = useDebouncedValue(text, 500);
	const prevSearchTerm = useRef('');

	const { data, isLoading, isSuccess, error, refetch } = useListUsers(
		searchTerm,
		prevSearchTerm,
		setCurrent,
		sortBy,
		sortDirection,
		itemsPerPage,
		current,
	);

	const useAllUsers = () => (tab === 'all' && isSuccess ? data?.users : []);

	const currentTabUsers = [...useAllUsers(), ...useFilterActiveUsers(data?.users, tab), ...useFilterPendingUsers(data?.users, tab)];
	const filteredUsers = useFilterUsersByRole(
		currentTabUsers,
		roleFilterSelectedOptions.map((currentRole) => currentRole.id),
	);

	useEffect(() => {
		reload.current = refetch;
		prevSearchTerm.current = searchTerm;
	}, [reload, refetch, searchTerm]);

	useEffect(() => {
		setRoleFilterOptions(roleFilterStructure);
	}, [roleFilterStructure]);

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
			(tab === 'active' || tab === 'all') && (
				<GenericTableHeaderCell
					w='x100'
					key='status'
					direction={sortDirection}
					active={sortBy === 'status'}
					onClick={setSort}
					sort='status'
				>
					{t('Registration_status')}
				</GenericTableHeaderCell>
			),
			tab === 'pending' && (
				<GenericTableHeaderCell w='x100' key='action' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
					{t('Pending_action')}
				</GenericTableHeaderCell>
			),
		],
		[mediaQuery, setSort, sortBy, sortDirection, t, tab],
	);

	if (error) {
		return null;
	}

	return (
		<>
			<FilterByText autoFocus placeholder={t('Search_Users')} onChange={({ text }): void => setText(text)}>
				<MultiSelectCustom
					dropdownOptions={roleFilterOptions}
					defaultTitle='All_roles'
					selectedOptionsTitle='Roles'
					setSelectedOptions={setRoleFilterSelectedOptions}
					selectedOptions={roleFilterSelectedOptions}
					customSetSelected={setRoleFilterOptions}
				/>
			</FilterByText>
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>{isLoading && <GenericTableLoadingTable headerCells={5} />}</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && !!data && !!filteredUsers && data.count > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{filteredUsers.map((user) => (
								<UsersTableRow key={user._id} onClick={handleClick} mediaQuery={mediaQuery} user={user} tab={tab} />
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

export default UsersTable;
