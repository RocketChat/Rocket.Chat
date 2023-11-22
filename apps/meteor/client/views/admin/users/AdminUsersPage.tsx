import { Button, ButtonGroup, Icon, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { usePermission, useRouteParameter, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import UserPageHeaderContentWithSeatsCap from '../../../../ee/client/views/admin/users/UserPageHeaderContentWithSeatsCap';
import { useSeatsCap } from '../../../../ee/client/views/admin/users/useSeatsCap';
import { Contextualbar, ContextualbarHeader, ContextualbarTitle, ContextualbarClose } from '../../../components/Contextualbar';
import Page from '../../../components/Page';
import PageContent from '../../../components/Page/PageContent';
import PageHeader from '../../../components/Page/PageHeader';
import { useShouldPreventAction } from '../../../hooks/useShouldPreventAction';
import AdminInviteUsers from './AdminInviteUsers';
import AdminUserCreated from './AdminUserCreated';
import AdminUserForm from './AdminUserForm';
import AdminUserFormWithData from './AdminUserFormWithData';
import AdminUserInfoWithData from './AdminUserInfoWithData';
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

	useEffect(() => {
		if (!context || !seatsCap) {
			return;
		}

		if (isCreateUserDisabled && !['edit', 'info'].includes(context)) {
			router.navigate('/admin/users');
		}
	}, [context, isCreateUserDisabled, router, seatsCap]);

	const handleReload = (): void => {
		seatsCap?.reload();
		reload.current();
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Users')}>
					{seatsCap && seatsCap.maxActiveUsers < Number.POSITIVE_INFINITY ? (
						<UserPageHeaderContentWithSeatsCap {...seatsCap} />
					) : (
						<ButtonGroup>
							{canCreateUser && (
								<Button icon='user-plus' onClick={() => router.navigate('/admin/users/new')}>
									{t('New')}
								</Button>
							)}
							{canBulkCreateUser && (
								<Button icon='mail' onClick={() => router.navigate('/admin/users/invite')}>
									{t('Invite')}
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
						<TabsItem selected={tab === 'invited'} onClick={() => setTab('invited')}>
							{t('Invited')}
						</TabsItem>
					</Tabs>
					<UsersTable reload={reload} tab={tab} onReload={handleReload} setPendingActionsCount={setPendingActionsCount} />
				</PageContent>
			</Page>
			{context && (
				<Contextualbar is='aside' aria-labelledby=''>
					<ContextualbarHeader>
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
					{context === 'info' && id && <AdminUserInfoWithData uid={id} onReload={handleReload} />}
					{context === 'edit' && id && <AdminUserFormWithData uid={id} onReload={handleReload} context={context} />}
					{context === 'new' && <AdminUserForm onReload={handleReload} setCreatedUsersCount={setCreatedUsersCount} context={context} />}
					{context === 'created' && id && <AdminUserCreated uid={id} createdUsersCount={createdUsersCount} />}
					{context === 'invite' && <AdminInviteUsers />}
				</Contextualbar>
			)}
		</Page>
	);
};

export default UsersPage;
