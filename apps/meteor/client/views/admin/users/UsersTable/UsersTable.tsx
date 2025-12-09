import type { IRole, IUser, Serialized } from '@rocket.chat/core-typings';
import { Pagination } from '@rocket.chat/fuselage';
import { useEffectEvent, useBreakpoints } from '@rocket.chat/fuselage-hooks';
import type { DefaultUserInfo } from '@rocket.chat/rest-typings';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '@rocket.chat/ui-client';
import type { usePagination, useSort } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement, Dispatch, SetStateAction, MouseEvent, KeyboardEvent } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import UsersTableFilters from './UsersTableFilters';
import UsersTableRow from './UsersTableRow';
import GenericNoResults from '../../../../components/GenericNoResults';
import type { AdminUsersTab, UsersFilters, UsersTableSortingOption } from '../AdminUsersPage';
import { useShowVoipExtension } from '../useShowVoipExtension';

type UsersTableProps = {
	tab: AdminUsersTab;
	roleData: { roles: IRole[] } | undefined;
	users: Serialized<DefaultUserInfo>[];
	total: number;
	isLoading: boolean;
	isError: boolean;
	isSuccess: boolean;
	onReload: () => void;
	setUserFilters: Dispatch<SetStateAction<UsersFilters>>;
	paginationData: ReturnType<typeof usePagination>;
	sortData: ReturnType<typeof useSort<UsersTableSortingOption>>;
	isSeatsCapExceeded: boolean;
};

const UsersTable = ({
	users,
	total,
	isLoading,
	isError,
	isSuccess,
	setUserFilters,
	roleData,
	tab,
	onReload,
	paginationData,
	sortData,
	isSeatsCapExceeded,
}: UsersTableProps): ReactElement | null => {
	const { t } = useTranslation();
	const router = useRouter();
	const breakpoints = useBreakpoints();

	const isMobile = !breakpoints.includes('xl');
	const isLaptop = !breakpoints.includes('xxl');

	const showVoipExtension = useShowVoipExtension();
	const { current, itemsPerPage, setCurrent, setItemsPerPage, ...paginationProps } = paginationData;

	const isKeyboardEvent = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>): event is KeyboardEvent<HTMLElement> => {
		return (event as KeyboardEvent<HTMLElement>).key !== undefined;
	};

	const handleClickOrKeyDown = useEffectEvent((id: IUser['_id'], e: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>): void => {
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
	});

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell
				key='name'
				direction={sortData?.sortDirection}
				active={sortData?.sortBy === 'name'}
				onClick={sortData?.setSort}
				sort='name'
			>
				{t('Name')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell
				key='username'
				direction={sortData?.sortDirection}
				active={sortData?.sortBy === 'username'}
				onClick={sortData?.setSort}
				sort='username'
			>
				{t('Username')}
			</GenericTableHeaderCell>,
			!isLaptop && (
				<GenericTableHeaderCell
					key='email'
					direction={sortData?.sortDirection}
					active={sortData?.sortBy === 'emails.address'}
					onClick={sortData?.setSort}
					sort='emails.address'
				>
					{t('Email')}
				</GenericTableHeaderCell>
			),
			!isLaptop && <GenericTableHeaderCell key='roles'>{t('Roles')}</GenericTableHeaderCell>,
			tab === 'all' && !isMobile && (
				<GenericTableHeaderCell
					key='status'
					direction={sortData?.sortDirection}
					active={sortData?.sortBy === 'status'}
					onClick={sortData?.setSort}
					sort='status'
				>
					{t('Registration_status')}
				</GenericTableHeaderCell>
			),
			tab === 'pending' && !isMobile && (
				<GenericTableHeaderCell
					key='action'
					direction={sortData?.sortDirection}
					active={sortData?.sortBy === 'active'}
					onClick={sortData?.setSort}
					sort='active'
				>
					{t('Pending_action')}
				</GenericTableHeaderCell>
			),
			tab === 'all' && showVoipExtension && (
				<GenericTableHeaderCell
					w='x180'
					key='freeSwitchExtension'
					direction={sortData?.sortDirection}
					active={sortData?.sortBy === 'freeSwitchExtension'}
					onClick={sortData?.setSort}
					sort='freeSwitchExtension'
				>
					{t('Voice_call_extension')}
				</GenericTableHeaderCell>
			),
			<GenericTableHeaderCell key='actions' w={tab === 'pending' ? 'x204' : 'x50'}>
				{t('Actions')}
			</GenericTableHeaderCell>,
		],
		[sortData, t, isLaptop, tab, isMobile, showVoipExtension],
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

			{isSuccess && users.length === 0 && (
				<GenericNoResults
					icon='user'
					title={t('Users_Table_Generic_No_users', {
						postProcess: 'sprintf',
						sprintf: [tab !== 'all' ? t(tab as TranslationKey) : ''],
					})}
					description={t(`Users_Table_no_${tab}_users_description`)}
				/>
			)}

			{isSuccess && users.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{users.map((user) => (
								<UsersTableRow
									key={user._id}
									tab={tab}
									user={user}
									isMobile={isMobile}
									isLaptop={isLaptop}
									isSeatsCapExceeded={isSeatsCapExceeded}
									showVoipExtension={showVoipExtension}
									onReload={onReload}
									onClick={handleClickOrKeyDown}
								/>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={total}
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
