import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

const UserPageHeaderContent = (): ReactElement => {
	const usersRoute = useRoute('admin-users');
	const t = useTranslation();

	const handleNewButtonClick = (): void => {
		usersRoute.push({ context: 'new' });
	};

	const handleInviteButtonClick = (): void => {
		usersRoute.push({ context: 'invite' });
	};

	return (
		<>
			<ButtonGroup>
				<Button onClick={handleNewButtonClick}>
					<Icon size='x20' name='user-plus' /> {t('New')}
				</Button>
				<Button onClick={handleInviteButtonClick}>
					<Icon size='x20' name='mail' /> {t('Invite')}
				</Button>
			</ButtonGroup>
		</>
	);
};

export default UserPageHeaderContent;
