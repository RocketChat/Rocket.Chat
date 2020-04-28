import { Box, Button, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { useSetting, useSettingDispatch } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';

function FinalStep() {
	const t = useTranslation();
	const siteUrl = useSetting('Site_Url');
	const setShowSetupWizard = useSettingDispatch('Show_Setup_Wizard');

	const handleClick = () => {
		setShowSetupWizard('completed');
	};

	return <Box is='section' width='full' maxWidth='x480' margin='auto'>
		<Tile is='main' padding='x40'>
			<Box margin='x32'>
				<Box is='span' textColor='hint' textStyle='c2'>
					{t('Launched_successfully')}
				</Box>
				<Box is='h1' textColor='default' textStyle='h1' marginBlockEnd='x32'>{t('Your_workspace_is_ready')}</Box>
				<Box textColor='default' textStyle='micro'>{t('Your_server_link')}</Box>
				<Box textColor='primary' textStyle='s1' marginBlockEnd='x24'>asdasdsds{siteUrl}</Box>
				<Button primary data-qa='go-to-workspace' onClick={handleClick}>{t('Go_to_your_workspace')}</Button>
			</Box>
		</Tile>
	</Box>;
}

export default FinalStep;
