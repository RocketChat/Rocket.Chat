import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import Page from '../../components/basic/Page';
import VerticalBar from '../../components/basic/VerticalBar';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../contexts/RouterContext';
import { UserInfoWithData } from './UserInfo';
import { EditUserWithData } from './EditUser';
import { AddUser } from './AddUser';
import { InviteUsers } from './InviteUsers';
import UsersTable from './UsersTable';

function UsersPage() {
	const t = useTranslation();

	const usersRoute = useRoute('admin-users');

	const handleVerticalBarCloseButtonClick = () => {
		usersRoute.push({});
	};

	const handleNewButtonClick = () => {
		usersRoute.push({ context: 'new' });
	};

	const handleInviteButtonClick = () => {
		usersRoute.push({ context: 'invite' });
	};

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Users')}>
				<ButtonGroup>
					<Button onClick={handleNewButtonClick}>
						<Icon name='plus'/> {t('New')}
					</Button>
					<Button onClick={handleInviteButtonClick}>
						<Icon name='send'/> {t('Invite')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<UsersTable />
			</Page.Content>
		</Page>
		{context && <VerticalBar>
			<VerticalBar.Header>
				{context === 'info' && t('User_Info')}
				{context === 'edit' && t('Edit_User')}
				{context === 'new' && t('Add_User')}
				{context === 'invite' && t('Invite_Users')}
				<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
			</VerticalBar.Header>
			<VerticalBar.Content>
				{context === 'info' && <UserInfoWithData userId={id}/>}
				{context === 'edit' && <EditUserWithData userId={id}/>}
				{context === 'new' && <AddUser/>}
				{context === 'invite' && <InviteUsers/>}
			</VerticalBar.Content>
		</VerticalBar>}
	</Page>;
}

export default UsersPage;
