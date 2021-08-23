import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import { useSeatsCapUsage } from '../../../../ee/client/hooks/useSeatsCapUsage';
import SeatsCapUsage from '../../../../ee/client/views/admin/users/SeatsCapUsage';
import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { useRoute, useCurrentRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AddUser } from './AddUser';
import EditUserWithData from './EditUserWithData';
import { InviteUsers } from './InviteUsers';
import { UserInfoWithData } from './UserInfo';
import UsersTable from './UsersTable';

function UsersPage() {
	const t = useTranslation();

	const usersRoute = useRoute('admin-users');

	const handleVerticalBarCloseButtonClick = () => {
		usersRoute.push({});
	};

	const [, { context, id }] = useCurrentRoute();

	const { shouldShowVerticalBar, handleLimitModal, members, limit } = useSeatsCapUsage();

	const handleNewButtonClick = () => {
		handleLimitModal(() => usersRoute.push({ context: 'new' }), 'add');
	};

	const handleInviteButtonClick = () => {
		handleLimitModal(() => usersRoute.push({ context: 'invite' }), 'invite');
	};

	const handleRequestSeats = () => {
		console.log('request seats');
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Users')}>
					<ButtonGroup>
						{limit !== 0 && <SeatsCapUsage members={members} limit={limit} />}
						<Button onClick={handleNewButtonClick}>
							<Icon size='x20' name='user-plus' /> {t('New')}
						</Button>
						<Button onClick={handleInviteButtonClick}>
							<Icon size='x20' name='mail' /> {t('Invite')}
						</Button>
						<Button onClick={handleRequestSeats}>
							<Icon size='x20' name='new-window' /> {t('Request_seats')}
						</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.Content>
					<UsersTable />
				</Page.Content>
			</Page>
			{context && shouldShowVerticalBar && (
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
