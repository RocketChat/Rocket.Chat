import React from 'react';

import { useTranslation } from '../providers/TranslationProvider';
import { AdminUserInformationStep } from './steps/AdminUserInformationStep';
import { SettingsBasedStep } from './steps/SettingsBasedStep';
import { RegisterServerStep } from './steps/RegisterServerStep';
import { Epilogue } from './Epilogue';
import { SideBar } from './SideBar';
import { useSetupWizardStepsState, finalStep } from './StepsState';

export function Steps() {
	const { currentStep } = useSetupWizardStepsState();
	const t = useTranslation();

	if (currentStep === finalStep) {
		return <Epilogue />;
	}

	return <>
		<SideBar
			steps={[
				{
					step: 1,
					title: t('Admin_Info'),
				},
				{
					step: 2,
					title: t('Organization_Info'),
				},
				{
					step: 3,
					title: t('Server_Info'),
				},
				{
					step: 4,
					title: t('Register_Server'),
				},
			]}
			currentStep={currentStep}
		/>
		<section className='SetupWizard__Steps'>
			<div className='SetupWizard__Steps-wrapper'>
				<AdminUserInformationStep step={1} title={t('Admin_Info')} active={currentStep === 1} />
				<SettingsBasedStep step={2} title={t('Organization_Info')} active={currentStep === 2} />
				<SettingsBasedStep step={3} title={t('Server_Info')} active={currentStep === 3} />
				<RegisterServerStep step={4} title={t('Register_Server')} active={currentStep === 4} />
			</div>
		</section>
	</>;
}
