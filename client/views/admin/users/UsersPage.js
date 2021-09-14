import React, { useEffect } from 'react';

import UserPageHeaderContentWithSeatsCap from '../../../../ee/client/views/admin/users/UserPageHeaderContentWithSeatsCap';
import { useSeatsCap } from '../../../../ee/client/views/admin/users/useSeatsCap';
import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AddUser } from './AddUser';
import EditUserWithData from './EditUserWithData';
import { InviteUsers } from './InviteUsers';
import { UserInfoWithData } from './UserInfo';
import UserPageHeaderContent from './UserPageHeaderContent';
import UsersTable from './UsersTable';

function UsersPage() {
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const seatsCap = useSeatsCap();
	const usersRoute = useRoute('admin-users');

	useEffect(() => {
		if (!context || !seatsCap) {
			return;
		}

		if (seatsCap.activeUsers >= seatsCap.maxActiveUsers && !['edit', 'info'].includes(context)) {
			usersRoute.push({});
		}
	}, [context, seatsCap, usersRoute]);

	const t = useTranslation();

	const handleVerticalBarCloseButtonClick = () => {
		usersRoute.push({});
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Users')}>
					{seatsCap &&
						(seatsCap.maxActiveUsers < Number.POSITIVE_INFINITY ? (
							<UserPageHeaderContentWithSeatsCap {...seatsCap} />
						) : (
							<UserPageHeaderContent />
						))}
				</Page.Header>
				<Page.Content>
					<UsersTable />
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar>
					<VerticalBar.Header>
						{context === 'info' && t('User_Info')}
						{context === 'edit' && t('Edit_User')}
						{context === 'new' && t('Add_User')}
						{context === 'invite' && t('Invite_Users')}
						<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
					</VerticalBar.Header>

					{context === 'info' && <UserInfoWithData uid={id} />}
					{context === 'edit' && <EditUserWithData uid={id} />}
					{context === 'new' && <AddUser />}
					{context === 'invite' && <InviteUsers />}
				</VerticalBar>
			)}
		</Page>
	);
}

export default UsersPage;
