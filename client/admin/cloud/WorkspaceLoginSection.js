import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';

function WorkspaceLoginSection({
	isLoggedIn,
	onLoginButtonClick,
	onLogoutButtonClick,
	onDisconnectButtonClick,
	...props
}) {
	const t = useTranslation();

	return <Box is='section' {...props}>
		<Box withRichContent>
			<p>{t('Cloud_workspace_connected')}</p>
		</Box>

		<ButtonGroup>
			{isLoggedIn
				? <Button primary danger onClick={onLogoutButtonClick}>{t('Cloud_logout')}</Button>
				: <Button primary onClick={onLoginButtonClick}>{t('Cloud_login_to_cloud')}</Button>}
		</ButtonGroup>

		<Box withRichContent>
			<p>{t('Cloud_workspace_disconnect')}</p>
		</Box>

		<ButtonGroup>
			<Button primary danger onClick={onDisconnectButtonClick}>{t('Disconnect')}</Button>
		</ButtonGroup>
	</Box>;
}

export default WorkspaceLoginSection;
