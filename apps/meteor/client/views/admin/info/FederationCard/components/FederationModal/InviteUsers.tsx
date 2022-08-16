import { Box, ButtonGroup, Button, Banner } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, ReactElement } from 'react';

const InviteUsers: FC<{ onClose: () => void }> = ({ onClose }): ReactElement => {
	const t = useTranslation();

	const directoryRoute = useRoute('directory');
	const handleDirectory = (): void => {
		onClose();
		directoryRoute.push({ tab: 'users' });
	};

	return (
		<Box display='flex' flexDirection='column' alignItems='stretch' flexGrow={1}>
			<Box fontWeight='c2' fontSize='p2'>
				{t('Federation_Inviting_users_from_another_server')}
			</Box>
			<Box mbs='x16'>{t('Federation_Search_users_you_want_to_connect')}</Box>
			<Box mbs='x16' pis='x16'>
				<ul style={{ listStyle: 'disc', listStylePosition: 'inside' }}>
					<li>{t('Federation_Username')}</li>
					<li>{t('Federation_Email')}</li>
				</ul>
			</Box>
			<Box mbs='x16' mbe='x16'>
				{t('Federation_You_will_invite_users_without_login_access')}
				<ButtonGroup mbs='x20' align='start'>
					<Button primary small onClick={handleDirectory}>
						{t('Federation_Invite_User')}
					</Button>
				</ButtonGroup>
			</Box>
			<Banner>
				<Box is='h2' fontWeight='c2'>
					{t('Federation_Invite_Users_To_Private_Rooms')}
				</Box>
				<p>{t('Federation_Channels_Will_Be_Replicated')}</p>
			</Banner>
		</Box>
	);
};

export default InviteUsers;
