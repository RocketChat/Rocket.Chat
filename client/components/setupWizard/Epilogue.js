import { Button } from '@rocket.chat/fuselage';
import React from 'react';

import { useSetSetting } from '../../hooks/useSetSetting';
import { useSetting } from '../../hooks/useSetting';
import { useTranslation } from '../providers/TranslationProvider';
import './Epilogue.css';

export function Epilogue({
	logoSrc = 'images/logo/logo.svg',
}) {
	const t = useTranslation();
	const siteUrl = useSetting('Site_Url');
	const setShowSetupWizard = useSetSetting('Show_Setup_Wizard');

	const handleClick = () => {
		setShowSetupWizard('completed');
	};

	return <section className='SetupWizard__Epilogue'>
		<header className='SetupWizard__Epilogue-header'>
			<img className='SetupWizard__Epilogue-headerLogo' src={logoSrc} />
		</header>

		<main className='SetupWizard__Epilogue-content'>
			<span className='SetupWizard__Epilogue-runningHead'>{t('Launched_successfully')}</span>
			<h1 className='SetupWizard__Epilogue-title'>{t('Your_workspace_is_ready')}</h1>
			<span className='SetupWizard__Epilogue-linkLabel'>{t('Your_server_link')}</span>
			<span className='SetupWizard__Epilogue-link'>{siteUrl}</span>
			<Button primary onClick={handleClick} className='SetupWizard__Epilogue__goToWorkspace'>
				{t('Go_to_your_workspace')}
			</Button>
		</main>
	</section>;
}
