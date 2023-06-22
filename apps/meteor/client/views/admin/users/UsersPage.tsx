import { Button, ButtonGroup, Icon, Tabs } from '@rocket.chat/fuselage';
import { usePermission, useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import UserPageHeaderContentWithSeatsCap from '../../../../ee/client/views/admin/users/UserPageHeaderContentWithSeatsCap';
import { useSeatsCap } from '../../../../ee/client/views/admin/users/useSeatsCap';
import { Contextualbar, ContextualbarHeader, ContextualbarTitle, ContextualbarClose } from '../../../components/Contextualbar';
import Page from '../../../components/Page';
import AddUser from './AddUser';
import AdminUserInfoWithData from './AdminUserInfoWithData';
import EditUserWithData from './EditUserWithData';
import InviteUsers from './InviteUsers';
import UsersTable from './UsersTable';

const UsersPage = (): ReactElement => {
	const t = useTranslation();
	const seatsCap = useSeatsCap();
	const reload = useRef(() => null);
	const canCreateUser = usePermission('create-user');
	const canBulkCreateUser = usePermission('bulk-register-user');

	const router = useRoute('admin-users');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const [tab, setTab] = useState<string>('all');

	useEffect(() => {
		if (!context || !seatsCap) {
			return;
		}

		if (seatsCap.activeUsers >= seatsCap.maxActiveUsers && context && !['edit', 'info'].includes(context)) {
			router.push({});
		}
	}, [context, seatsCap, tab, router]);

	const handleCloseContextualbar = (): void => {
		router.push({});
	};

	const handleNewUser = (): void => {
		router.push({ context: 'new' });
	};

	const handleInviteUser = (): void => {
		router.push({ context: 'invite' });
	};

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
								<Button onClick={handleNewUser}>
									<Icon size='x20' name='user-plus' /> {t('New')}
								</Button>
							)}
							{canBulkCreateUser && (
								<Button onClick={handleInviteUser}>
									<Icon size='x20' name='mail' /> {t('Invite')}
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
						<ContextualbarClose onClick={handleCloseContextualbar} />
					</ContextualbarHeader>
					{context === 'info' && id && <AdminUserInfoWithData uid={id} onReload={handleReload} />}
					{context === 'edit' && id && <EditUserWithData uid={id} onReload={handleReload} />}
					{context === 'new' && <AddUser onReload={handleReload} />}
					{context === 'invite' && <InviteUsers />}
				</Contextualbar>
			)}
		</Page>
	);
};

export default UsersPage;
