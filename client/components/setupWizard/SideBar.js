import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { useSetupWizardStepsState } from './StepsState';
import './SideBar.css';

export function SideBar({ steps = [] }) {
	const { currentStep } = useSetupWizardStepsState();

	const t = useTranslation();

	return <aside className='SetupWizard__SideBar'>
		<header className='SetupWizard__SideBar-header'>
			<img className='SetupWizard__SideBar-headerLogo' src='images/logo/logo.svg' />
			<span className='SetupWizard__SideBar-headerTag'>{t('Setup_Wizard')}</span>
		</header>

		<div className='SetupWizard__SideBar-content'>
			<h2 className='SetupWizard__SideBar-title'>{t('Setup_Wizard')}</h2>
			<p className='SetupWizard__SideBar-text'>{t('Setup_Wizard_Info')}</p>

			<ol className='SetupWizard__SideBar-steps'>
				{steps.map(({ step, title }) =>
					<li
						key={step}
						className={[
							'SetupWizard__SideBar-step',
							step === currentStep && 'SetupWizard__SideBar-step--active',
							step < currentStep && 'SetupWizard__SideBar-step--past',
						].filter(Boolean).join(' ')}
						data-number={step}
					>
						{title}
					</li>
				)}
			</ol>
		</div>
	</aside>;
}
