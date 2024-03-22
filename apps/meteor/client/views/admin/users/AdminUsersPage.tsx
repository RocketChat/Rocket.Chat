import type { IAdminUserTabs } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, Callout, ContextualbarIcon, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { usePermission, useRouteParameter, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import UserPageHeaderContentWithSeatsCap from '../../../../ee/client/views/admin/users/UserPageHeaderContentWithSeatsCap';
import { useSeatsCap } from '../../../../ee/client/views/admin/users/useSeatsCap';
import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarDialog,
} from '../../../components/Contextualbar';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import { Page, PageHeader, PageContent } from '../../../components/Page';
import { useShouldPreventAction } from '../../../hooks/useShouldPreventAction';
import AdminInviteUsers from './AdminInviteUsers';
import AdminUserForm from './AdminUserForm';
import AdminUserFormWithData from './AdminUserFormWithData';
import AdminUserInfoWithData from './AdminUserInfoWithData';
import AdminUserUpgrade from './AdminUserUpgrade';
import UsersTable from './UsersTable';
import useFilteredUsers from './hooks/useFilteredUsers';
import usePendingUsersCount from './hooks/usePendingUsersCount';

export type UsersFilters = {
	text: string;
};

export type UsersTableSortingOptions = 'name' | 'username' | 'emails.address' | 'status';

const AdminUsersPage = (): ReactElement => {
	const t = useTranslation();

	const seatsCap = useSeatsCap();

	const isSeatsCapExceeded = useMemo(() => !!seatsCap && seatsCap.activeUsers >= seatsCap.maxActiveUsers, [seatsCap]);

	const router = useRouter();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const canCreateUser = usePermission('create-user');
	const canBulkCreateUser = usePermission('bulk-register-user');

	const isCreateUserDisabled = useShouldPreventAction('activeUsers');

	const paginationData = usePagination();
	const sortData = useSort<UsersTableSortingOptions>('name');

	const [tab, setTab] = useState<IAdminUserTabs>('all');
	const [userFilters, setUserFilters] = useState<UsersFilters>({ text: '' });

	const searchTerm = useDebouncedValue(userFilters.text, 500);
	const prevSearchTerm = useRef('');

	const filteredUsersQueryResult = useFilteredUsers({
		searchTerm,
		prevSearchTerm,
		sortData,
		paginationData,
		tab,
	});

	const pendingUsersCount = usePendingUsersCount(filteredUsersQueryResult.data?.users);

	const handleReload = (): void => {
		seatsCap?.reload();
		filteredUsersQueryResult?.refetch();
	};

	const handleTabChangeAndSort = (tab: IAdminUserTabs) => {
		setTab(tab);

		sortData.setSort(tab === 'pending' ? 'active' : 'name', 'asc');
	};

	useEffect(() => {
		prevSearchTerm.current = searchTerm;
	}, [searchTerm]);

	const isRoutePrevented = useMemo(
		() => context && ['new', 'invite'].includes(context) && isCreateUserDisabled,
		[context, isCreateUserDisabled],
	);

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Users')}>
					{seatsCap && seatsCap.maxActiveUsers < Number.POSITIVE_INFINITY ? (
						<UserPageHeaderContentWithSeatsCap isSeatsCapExceeded={isSeatsCapExceeded} {...seatsCap} />
					) : (
						<ButtonGroup>
							{canBulkCreateUser && (
								<Button icon='mail' onClick={() => router.navigate('/admin/users/invite')} disabled={isSeatsCapExceeded}>
									{t('Invite')}
								</Button>
							)}
							{canCreateUser && (
								<Button icon='user-plus' onClick={() => router.navigate('/admin/users/new')} disabled={isSeatsCapExceeded}>
									{t('New_user')}
								</Button>
							)}
						</ButtonGroup>
					)}
				</PageHeader>
				<PageContent>
					{isSeatsCapExceeded && (
						<Callout title={t('Service_disruptions_occurring')} type='danger' mbe={19}>
							{t('Your_workspace_exceeded_the_seat_license_limit')}
						</Callout>
					)}
					<Tabs>
						<TabsItem selected={!tab || tab === 'all'} onClick={() => handleTabChangeAndSort('all')}>
							{t('All')}
						</TabsItem>
						<TabsItem selected={tab === 'pending'} onClick={() => handleTabChangeAndSort('pending')}>
							{pendingUsersCount ? `${t('Pending')} (${pendingUsersCount})` : t('Pending')}
						</TabsItem>
					</Tabs>
					<UsersTable
						filteredUsersQueryResult={filteredUsersQueryResult}
						setUserFilters={setUserFilters}
						onReload={handleReload}
						paginationData={paginationData}
						sortData={sortData}
						tab={tab}
						isSeatsCapExceeded={isSeatsCapExceeded}
					/>
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog>
					<Contextualbar>
						<ContextualbarHeader>
							{context === 'upgrade' && <ContextualbarIcon name='user-plus' />}
							<ContextualbarTitle>
								{context === 'info' && t('User_Info')}
								{context === 'edit' && t('Edit_User')}
								{context === 'new' && t('Add_User')}
								{context === 'invite' && t('Invite_Users')}
							</ContextualbarTitle>
							<ContextualbarClose onClick={() => router.navigate('/admin/users')} />
						</ContextualbarHeader>
						{context === 'info' && id && <AdminUserInfoWithData uid={id} onReload={handleReload} />}
						{context === 'edit' && id && <AdminUserFormWithData uid={id} onReload={handleReload} />}
						{!isRoutePrevented && context === 'new' && <AdminUserForm onReload={handleReload} />}
						{!isRoutePrevented && context === 'invite' && <AdminInviteUsers />}
						{isRoutePrevented && <AdminUserUpgrade />}
					</Contextualbar>
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default AdminUsersPage;
