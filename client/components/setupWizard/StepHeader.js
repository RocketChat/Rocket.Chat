import { Headline } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import './StepHeader.css';

export function StepHeader({ number, title }) {
	const t = useTranslation();

	return <header className='SetupWizard__StepHeader'>
		<p className='SetupWizard__StepHeader-runningHead'>{t('Step')} {number}</p>
		<Headline as='h2'>{title}</Headline>
	</header>;
}
