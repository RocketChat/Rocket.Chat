import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, ReactElement, useRef } from 'react';

import UserPageHeaderContentWithSeatsCap from '../../../../ee/client/views/admin/users/UserPageHeaderContentWithSeatsCap';
import { useSeatsCap } from '../../../../ee/client/views/admin/users/useSeatsCap';
import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import AddUser from './AddUser';
import AdminUserInfoWithData from './AdminUserInfoWithData';
import EditUserWithData from './EditUserWithData';
import InviteUsers from './InviteUsers';
import UsersTable from './UsersTable';

const UsersPage = (): ReactElement => {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const seatsCap = useSeatsCap();
	const reload = useRef(() => null);
	const usersRoute = useRoute('admin-users');

	useEffect(() => {
		if (!context || !seatsCap) {
			return;
		}

		if (seatsCap.activeUsers >= seatsCap.maxActiveUsers && !['edit', 'info'].includes(context)) {
			usersRoute.push({});
		}
	}, [context, seatsCap, usersRoute]);

	const handleCloseVerticalBar = (): void => {
		usersRoute.push({});
	};

	const handleNewUser = (): void => {
		usersRoute.push({ context: 'new' });
	};

	const handleInviteUser = (): void => {
		usersRoute.push({ context: 'invite' });
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
							<Button onClick={handleNewUser}>
								<Icon size='x20' name='user-plus' /> {t('New')}
							</Button>
							<Button onClick={handleInviteUser}>
								<Icon size='x20' name='mail' /> {t('Invite')}
							</Button>
						</ButtonGroup>
					)}
				</Page.Header>
				<Page.Content>
					<UsersTable reload={reload} />
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar>
					<VerticalBar.Header>
						<VerticalBar.Text>
							{context === 'info' && t('User_Info')}
							{context === 'edit' && t('Edit_User')}
							{context === 'new' && t('Add_User')}
							{context === 'invite' && t('Invite_Users')}
						</VerticalBar.Text>
						<VerticalBar.Close onClick={handleCloseVerticalBar} />
					</VerticalBar.Header>
					{context === 'info' && id && <AdminUserInfoWithData uid={id} onReload={handleReload} />}
					{context === 'edit' && id && <EditUserWithData uid={id} onReload={handleReload} />}
					{context === 'new' && <AddUser onReload={handleReload} />}
					{context === 'invite' && <InviteUsers />}
				</VerticalBar>
			)}
		</Page>
	);
};

export default UsersPage;
