import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import './StepHeader.css';

export function StepHeader({ number, title }) {
	const t = useTranslation();

	return <header className='SetupWizard__StepHeader'>
		<p className='SetupWizard__StepHeader-runningHead'>{t('Step')} {number}</p>
		<h2 className='SetupWizard__StepHeader-title'>{title}</h2>
	</header>;
}
