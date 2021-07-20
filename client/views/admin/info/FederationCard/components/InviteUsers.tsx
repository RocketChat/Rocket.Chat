import { Box, ButtonGroup, Button, Banner } from '@rocket.chat/fuselage';
import React, { FC, ReactElement } from 'react';

import { useRoute } from '../../../../../contexts/RouterContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';

const InviteUsers: FC = (): ReactElement => {
	const t = useTranslation();

	const directoryRoute = useRoute('directory');
	const handleDirectory = (): void => directoryRoute.push({ tab: 'users' });

	return (
		<Box display='flex' flexDirection='column' alignItems='stretch' flexGrow={1}>
			<Box style={{ fontWeight: 600 }}>{t('Federation_Inviting_users_from_another_server')}</Box>
			<Box style={{ marginTop: 20 }}>{t('Federation_Search_users_you_want_to_connect')}</Box>
			<Box style={{ marginTop: 20, paddingLeft: '1em' }}>
				<ul style={{ listStyle: 'disc', listStylePosition: 'inside' }}>
					<li>{t('Federation_Username')}</li>
					<li>{t('Federation_Email')}</li>
				</ul>
			</Box>
			<Box style={{ marginTop: 20 }}>
				{t('Federation_You_will_invite_users_without_login_access')}
			</Box>
			<ButtonGroup align='start' style={{ marginTop: 20 }}>
				<Button primary small onClick={handleDirectory}>
					{t('Federation_Invite_User')}
				</Button>
			</ButtonGroup>
			<Banner style={{ marginTop: 20 }}>
				<h2 style={{ fontWeight: 600 }}>{t('Federation_Invite_Users_To_Private_Rooms')}</h2>
				<p>{t('Federation_Channels_Will_Be_Replicated')}</p>
			</Banner>
		</Box>
	);
};

export default InviteUsers;
