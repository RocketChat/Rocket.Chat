import { Pagination, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useMediaQuery, useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
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
import { useListUsers } from '../hooks/useListUsers';
import UsersTableRow from './UsersTableRow';

type UsersTableProps = {
	reload: MutableRefObject<() => void>;
	tab: string;
	onReload: () => void;
	setPendingActionsCount: React.Dispatch<React.SetStateAction<number>>;
};

const UsersTable = ({ reload, tab, onReload, setPendingActionsCount }: UsersTableProps): ReactElement | null => {
	const t = useTranslation();
	const router = useRouter();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const [text, setText] = useState('');

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'username' | 'emails.address' | 'status'>('name');

	const searchTerm = useDebouncedValue(text, 500);
	const prevSearchTerm = useRef('');

	const { data, isLoading, isSuccess, isError, refetch } = useListUsers(
		searchTerm,
		prevSearchTerm,
		setCurrent,
		sortBy,
		sortDirection,
		itemsPerPage,
		current,
		setPendingActionsCount,
	);

	const useAllUsers = () => (tab === 'all' && isSuccess ? data?.users : []);

	// TODO: fix types
	const filteredUsers = [...useAllUsers(), ...useFilterActiveUsers(data?.users, tab), ...useFilterPendingUsers(data?.users as any, tab)];

	useEffect(() => {
		reload.current = refetch;
		prevSearchTerm.current = searchTerm;
	}, [reload, refetch, searchTerm]);

	const isKeyboardEvent = (
		event: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>,
	): event is React.KeyboardEvent<HTMLElement> => {
		return (event as React.KeyboardEvent<HTMLElement>).key !== undefined;
	};

	const handleClickOrKeyDown = useMutableCallback(
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
			mediaQuery && (
				<GenericTableHeaderCell key='username' direction={sortDirection} active={sortBy === 'username'} onClick={setSort} sort='username'>
					{t('Username')}
				</GenericTableHeaderCell>
			),
			mediaQuery && (
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

			mediaQuery && (
				<GenericTableHeaderCell key='roles' onClick={setSort}>
					{t('Roles')}
				</GenericTableHeaderCell>
			),
			tab === 'all' && (
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
			<GenericTableHeaderCell key='actions' w='x44' />,

			tab === 'all' && (
				<GenericTableHeaderCell key='action' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
					{t('Token')}
				</GenericTableHeaderCell>
			),

			tab === 'pending' && (
				<GenericTableHeaderCell key='action' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
					{t('Pending_action')}
				</GenericTableHeaderCell>
			),

			<GenericTableHeaderCell key='menu' />,
		],
		[mediaQuery, setSort, sortBy, sortDirection, t, tab],
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

			{isSuccess && !!data && !!filteredUsers && data.count > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{!isLoading && !isSuccess && tab !== 'all' && tab !== 'active' && (
								<States>
									<StatesIcon name='user' />
									<StatesTitle>{tab === 'pending' ? t('No_pending_users') : t('No_deactivated_users')}</StatesTitle>
									<StatesSubtitle>{tab === 'pending' ? t('Users_who_are_pending') : t('Deactivated_users_appear_here')}</StatesSubtitle>
								</States>
							)}
							{filteredUsers.map((user) => (
								<UsersTableRow
									key={user._id}
									onClick={handleClickOrKeyDown}
									mediaQuery={mediaQuery}
									user={user}
									refetchUsers={refetch}
									onReload={onReload}
									tab={tab}
								/>
							))}
						</GenericTableBody>
					</GenericTable>
				</>
			)}
			<Pagination
				divider
				current={current}
				itemsPerPage={itemsPerPage}
				count={data?.total || 0}
				onSetItemsPerPage={setItemsPerPage}
				onSetCurrent={setCurrent}
				{...paginationProps}
			/>

			{isSuccess && data?.count === 0 && <GenericNoResults />}
			{isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesActions>
						<StatesAction onClick={() => refetch()}>{t('Reload_page')}</StatesAction>
					</StatesActions>
				</States>
			)}
		</>
	);
};

export default UsersTable;
