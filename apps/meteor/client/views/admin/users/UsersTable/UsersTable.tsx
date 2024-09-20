import type { IRole, Serialized } from '@rocket.chat/core-typings';
import { Pagination } from '@rocket.chat/fuselage';
import { useEffectEvent, useBreakpoints } from '@rocket.chat/fuselage-hooks';
import type { PaginatedResult, DefaultUserInfo } from '@rocket.chat/rest-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactElement, Dispatch, SetStateAction } from 'react';
import React, { useMemo } from 'react';

import GenericNoResults from '../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../../components/GenericTable';
import type { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import type { useSort } from '../../../../components/GenericTable/hooks/useSort';
import type { AdminUserTab, UsersFilters, UsersTableSortingOptions } from '../AdminUsersPage';
import UsersTableFilters from './UsersTableFilters';
import UsersTableRow from './UsersTableRow';

type UsersTableProps = {
	tab: AdminUserTab;
	roleData: { roles: IRole[] } | undefined;
	onReload: () => void;
	setUserFilters: Dispatch<SetStateAction<UsersFilters>>;
	filteredUsersQueryResult: UseQueryResult<PaginatedResult<{ users: Serialized<DefaultUserInfo>[] }>>;
	paginationData: ReturnType<typeof usePagination>;
	sortData: ReturnType<typeof useSort<UsersTableSortingOptions>>;
	isSeatsCapExceeded: boolean;
};

const UsersTable = ({
	filteredUsersQueryResult,
	setUserFilters,
	roleData,
	tab,
	onReload,
	paginationData,
	sortData,
	isSeatsCapExceeded,
}: UsersTableProps): ReactElement | null => {
	const t = useTranslation();
	const router = useRouter();
	const breakpoints = useBreakpoints();

	const isMobile = !breakpoints.includes('xl');
	const isLaptop = !breakpoints.includes('xxl');

	const { data, isLoading, isError, isSuccess } = filteredUsersQueryResult;

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = paginationData;
	const { sortBy, sortDirection, setSort } = sortData;

	const isKeyboardEvent = (
		event: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>,
	): event is React.KeyboardEvent<HTMLElement> => {
		return (event as React.KeyboardEvent<HTMLElement>).key !== undefined;
	};

	const handleClickOrKeyDown = useEffectEvent(
		(id, e: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>): void => {
			e.stopPropagation();

			const keyboardSubmitKeys = ['Enter', ' '];

			if (isKeyboardEvent(e) && !keyboardSubmitKeys.includes(e.key)) {
				return;
			}

			router.navigate({
				name: 'admin-users',
				params: {
					context: 'info',
					id,
				},
			});
		},
	);

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='username' direction={sortDirection} active={sortBy === 'username'} onClick={setSort} sort='username'>
				{t('Username')}
			</GenericTableHeaderCell>,
			!isLaptop && (
				<GenericTableHeaderCell
					key='email'
					direction={sortDirection}
					active={sortBy === 'emails.address'}
					onClick={setSort}
					sort='emails.address'
				>
					{t('Email')}
				</GenericTableHeaderCell>
			),
			!isLaptop && <GenericTableHeaderCell key='roles'>{t('Roles')}</GenericTableHeaderCell>,
			tab === 'all' && !isMobile && (
				<GenericTableHeaderCell key='status' direction={sortDirection} active={sortBy === 'status'} onClick={setSort} sort='status'>
					{t('Registration_status')}
				</GenericTableHeaderCell>
			),
			tab === 'pending' && !isMobile && (
				<GenericTableHeaderCell key='action' direction={sortDirection} active={sortBy === 'active'} onClick={setSort} sort='active'>
					{t('Pending_action')}
				</GenericTableHeaderCell>
			),
			<GenericTableHeaderCell key='actions' w={tab === 'pending' ? 'x204' : ''} />,
		],
		[isLaptop, isMobile, setSort, sortBy, sortDirection, t, tab],
	);

	return (
		<>
			<UsersTableFilters roleData={roleData} setUsersFilters={setUserFilters} />

			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={5} />
					</GenericTableBody>
				</GenericTable>
			)}

			{isError && (
				<GenericNoResults icon='warning' title={t('Something_went_wrong')} buttonTitle={t('Reload_page')} buttonAction={onReload} />
			)}

			{isSuccess && data.users.length === 0 && (
				<GenericNoResults
					icon='user'
					title={t('Users_Table_Generic_No_users', t((tab !== 'all' ? tab : '') as TranslationKey))}
					description={t(`Users_Table_no_${tab}_users_description`)}
				/>
			)}

			{isSuccess && !!data?.users && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.users.map((user) => (
								<UsersTableRow
									key={user._id}
									onClick={handleClickOrKeyDown}
									isMobile={isMobile}
									isLaptop={isLaptop}
									user={user}
									onReload={onReload}
									tab={tab}
									isSeatsCapExceeded={isSeatsCapExceeded}
								/>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data.total || 0}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</>
	);
};

export default UsersTable;
