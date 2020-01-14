import { Box, Button, Margins, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { useSetting, useSettingDispatch } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import './FinalStep.css';

export function FinalStep() {
	const t = useTranslation();
	const siteUrl = useSetting('Site_Url');
	const setShowSetupWizard = useSettingDispatch('Show_Setup_Wizard');

	const handleClick = () => {
		setShowSetupWizard('completed');
	};

	return <Box is='section' className='SetupWizard__FinalStep'>
		<Tile is='main' padding='x40'>
			<Margins all='x32'>
				<Box>
					<Box is='span' textColor='hint' className='SetupWizard__FinalStep-runningHead'>
						{t('Launched_successfully')}
					</Box>
					<Margins blockEnd='x32'>
						<Box is='h1' textColor='default' className='SetupWizard__FinalStep-title'>{t('Your_workspace_is_ready')}</Box>
					</Margins>
					<Box textColor='default' textStyle='micro' className='SetupWizard__FinalStep-linkLabel'>{t('Your_server_link')}</Box>
					<Box textColor='primary' textStyle='p1' className='SetupWizard__FinalStep-link'>{siteUrl}</Box>
					<Button primary data-qa='go-to-workspace' onClick={handleClick}>{t('Go_to_your_workspace')}</Button>
				</Box>
			</Margins>
		</Tile>
	</Box>;
}
