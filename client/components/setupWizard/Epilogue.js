import { Box, Button, Margins, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { useSetting, useSettingDispatch } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { Logo } from './Logo';
import './Epilogue.css';

export function Epilogue() {
	const t = useTranslation();
	const siteUrl = useSetting('Site_Url');
	const setShowSetupWizard = useSettingDispatch('Show_Setup_Wizard');

	const handleClick = () => {
		setShowSetupWizard('completed');
	};

	return <Box is='section' className='SetupWizard__Epilogue'>
		<Box is='header' className='SetupWizard__Epilogue-header'>
			<Logo className='SetupWizard__Epilogue-headerLogo' />
		</Box>

		<Tile is='main' padding='44'>
			<Margins all='32'>
				<Box>
					<Box is='span' textColor='hint' className='SetupWizard__Epilogue-runningHead'>
						{t('Launched_successfully')}
					</Box>
					<Margins blockEnd='32'>
						<Box is='h1' textColor='default' className='SetupWizard__Epilogue-title'>{t('Your_workspace_is_ready')}</Box>
					</Margins>
					<Box textColor='default' textStyle='micro' className='SetupWizard__Epilogue-linkLabel'>{t('Your_server_link')}</Box>
					<Box textColor='primary' textStyle='p1' className='SetupWizard__Epilogue-link'>{siteUrl}</Box>
					<Button primary onClick={handleClick}>{t('Go_to_your_workspace')}</Button>
				</Box>
			</Margins>
		</Tile>
	</Box>;
}
