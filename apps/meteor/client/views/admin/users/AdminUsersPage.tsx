import { Button, ButtonGroup, Tabs } from '@rocket.chat/fuselage';
import { usePermission, useRouteParameter, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import UserPageHeaderContentWithSeatsCap from '../../../../ee/client/views/admin/users/UserPageHeaderContentWithSeatsCap';
import { useSeatsCap } from '../../../../ee/client/views/admin/users/useSeatsCap';
import { Contextualbar, ContextualbarHeader, ContextualbarTitle, ContextualbarClose } from '../../../components/Contextualbar';
import Page from '../../../components/Page';
import AdminInviteUsers from './AdminInviteUsers';
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

	const [tab, setTab] = useState<string>('all');

	useEffect(() => {
		if (!context || !seatsCap) {
			return;
		}

		if (seatsCap.activeUsers >= seatsCap.maxActiveUsers && context && !['edit', 'info'].includes(context)) {
			router.navigate('/admin/users');
		}
	}, [context, seatsCap, tab, router]);

	const handleReload = (): void => {
		seatsCap?.reload();
		reload.current();
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Users')}>
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
				</Page.Header>
				<Page.Content>
					<Tabs>
						<Tabs.Item selected={!tab || tab === 'all'} onClick={() => setTab('all')}>
							{t('All')}
						</Tabs.Item>
						<Tabs.Item selected={tab === 'tab-invited'} onClick={() => setTab('tab-invited')}>
							{t('Invited')}
						</Tabs.Item>
						<Tabs.Item selected={tab === 'tab-new'} onClick={() => setTab('tab-new')}>
							{t('New_users')}
						</Tabs.Item>
						<Tabs.Item selected={tab === 'tab-active'} onClick={() => setTab('tab-active')}>
							{t('Active')}
						</Tabs.Item>
						<Tabs.Item selected={tab === 'tab-deactivated'} onClick={() => setTab('tab-deactivated')}>
							{t('Deactivated')}
						</Tabs.Item>
					</Tabs>
					<UsersTable reload={reload} />
				</Page.Content>
			</Page>
			{context && (
				<Contextualbar>
					<ContextualbarHeader>
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
					{context === 'new' && <AdminUserForm onReload={handleReload} />}
					{context === 'invite' && <AdminInviteUsers />}
				</Contextualbar>
			)}
		</Page>
	);
};

export default UsersPage;
