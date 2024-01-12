import { Button, ButtonGroup, ContextualbarIcon, Icon, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { usePermission, useRouteParameter, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useRef, useState } from 'react';

import UserPageHeaderContentWithSeatsCap from '../../../../ee/client/views/admin/users/UserPageHeaderContentWithSeatsCap';
import { useSeatsCap } from '../../../../ee/client/views/admin/users/useSeatsCap';
import { Contextualbar, ContextualbarHeader, ContextualbarTitle, ContextualbarClose } from '../../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../../components/Page';
import { useShouldPreventAction } from '../../../hooks/useShouldPreventAction';
import AdminInviteUsers from './AdminInviteUsers';
import AdminUserCreated from './AdminUserCreated';
import AdminUserForm from './AdminUserForm';
import AdminUserFormWithData from './AdminUserFormWithData';
import AdminUserInfoWithData from './AdminUserInfoWithData';
import AdminUserUpgrade from './AdminUserUpgrade';
import UsersTable from './UsersTable';

const UsersPage = (): ReactElement => {
	const t = useTranslation();

	const seatsCap = useSeatsCap();
	const reload = useRef(() => null);

	const router = useRouter();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const canCreateUser = usePermission('create-user');
	const canBulkCreateUser = usePermission('bulk-register-user');
	const isCreateUserDisabled = useShouldPreventAction('activeUsers');

	const [tab, setTab] = useState<'all' | 'invited' | 'active' | 'deactivated' | 'pending'>('all');
	const [pendingActionsCount, setPendingActionsCount] = useState<number>(0);
	const [createdUsersCount, setCreatedUsersCount] = useState(0);

	const handleReload = (): void => {
		seatsCap?.reload();
		reload.current();
	};

	const isRoutePrevented = context && ['new', 'invite'].includes(context) && isCreateUserDisabled;

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Users')}>
					{seatsCap && seatsCap.maxActiveUsers < Number.POSITIVE_INFINITY ? (
						<UserPageHeaderContentWithSeatsCap {...seatsCap} />
					) : (
						<ButtonGroup>
							{canBulkCreateUser && (
								<Button icon='mail' onClick={() => router.navigate('/admin/users/invite')}>
									{t('Invite')}
								</Button>
							)}
							{canCreateUser && (
								<Button icon='user-plus' onClick={() => router.navigate('/admin/users/new')}>
									{t('New_user')}
								</Button>
							)}
						</ButtonGroup>
					)}
				</PageHeader>
				<PageContent>
					<Tabs>
						<TabsItem selected={!tab || tab === 'all'} onClick={() => setTab('all')}>
							{t('All')}
						</TabsItem>
						<TabsItem selected={tab === 'pending'} onClick={() => setTab('pending')}>
							{pendingActionsCount === 0 ? t('Pending') : `${t('Pending')} (${pendingActionsCount})`}
						</TabsItem>
						<TabsItem selected={tab === 'active'} onClick={() => setTab('active')}>
							{t('Active')}
						</TabsItem>
						<TabsItem selected={tab === 'deactivated'} onClick={() => setTab('deactivated')}>
							{t('Deactivated')}
						</TabsItem>
					</Tabs>
					<UsersTable reload={reload} tab={tab} onReload={handleReload} setPendingActionsCount={setPendingActionsCount} />
				</PageContent>
			</Page>
			{context && (
				<Contextualbar is='aside' aria-labelledby=''>
					<ContextualbarHeader>
						{context === 'upgrade' && <ContextualbarIcon name='user-plus' />}
						<ContextualbarTitle>
							{context === 'info' && t('User_Info')}
							{context === 'edit' && t('Edit_User')}
							{(context === 'new' || context === 'created') && (
								<>
									<Icon name='user-plus' size={20} /> {t('New_user')}
								</>
							)}
							{context === 'invite' && t('Invite_Users')}
						</ContextualbarTitle>
						<ContextualbarClose onClick={() => router.navigate('/admin/users')} />
					</ContextualbarHeader>
					{context === 'info' && id && <AdminUserInfoWithData uid={id} onReload={handleReload} tab={tab} />}
					{context === 'edit' && id && <AdminUserFormWithData uid={id} onReload={handleReload} context={context} />}
					{!isRoutePrevented && context === 'new' && (
						<AdminUserForm onReload={handleReload} setCreatedUsersCount={setCreatedUsersCount} context={context} />
					)}
					{!isRoutePrevented && context === 'created' && id && <AdminUserCreated uid={id} createdUsersCount={createdUsersCount} />}
					{!isRoutePrevented && context === 'invite' && <AdminInviteUsers />}
					{isRoutePrevented && <AdminUserUpgrade />}
				</Contextualbar>
			)}
		</Page>
	);
};

export default UsersPage;
