import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { useSetting } from '../../hooks/useSetting';
import { Button } from '../basic/Button';
import { setSetting } from './functions';
import './Epilogue.css';

export function Epilogue() {
	const t = useTranslation();
	const siteUrl = useSetting('Site_Url');

	const handleClick = () => {
		setSetting('Show_Setup_Wizard', 'completed');
	};

	return <section className='SetupWizard__Epilogue'>
		<header className='SetupWizard__Epilogue-header'>
			<img className='SetupWizard__Epilogue-headerLogo' src='images/logo/logo.svg' />
		</header>

		<main className='SetupWizard__Epilogue-content'>
			<span className='SetupWizard__Epilogue-runningHead'>{t('Launched_successfully')}</span>
			<h1 className='SetupWizard__Epilogue-title'>{t('Your_workspace_is_ready')}</h1>
			<span className='SetupWizard__Epilogue-linkLabel'>{t('Your_server_link')}</span>
			<span className='SetupWizard__Epilogue-link'>{siteUrl}</span>
			<Button primary onClick={handleClick}>
				{t('Go_to_your_workspace')}
			</Button>
		</main>
	</section>;
}
