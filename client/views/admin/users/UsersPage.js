import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { useRoute, useCurrentRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AddUser } from './AddUser';
import EditUserWithData from './EditUserWithData';
import { InviteUsers } from './InviteUsers';
import { UserInfoWithData } from './UserInfo';
import UsersTable from './UsersTable';

function UsersPage({ useQuery }) {
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

	const [params] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort] = useState([
		['name', 'asc'],
		['usernames', 'asc'],
	]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const { value: data = {}, reload } = useEndpointData('users.list', query);
	const [, { context, id }] = useCurrentRoute();

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Users')}>
					<ButtonGroup>
						<Button onClick={handleNewButtonClick}>
							<Icon name='plus' /> {t('New')}
						</Button>
						<Button onClick={handleInviteButtonClick}>
							<Icon name='send' /> {t('Invite')}
						</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.Content>
					<UsersTable users={data.users} total={data.total} />
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

					{context === 'info' && <UserInfoWithData uid={id} reloadTable={reload} />}
					{context === 'edit' && <EditUserWithData uid={id} />}
					{context === 'new' && <AddUser reloadTable={reload} />}
					{context === 'invite' && <InviteUsers />}
				</VerticalBar>
			)}
		</Page>
	);
}

export default UsersPage;
