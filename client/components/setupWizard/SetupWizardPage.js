import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useWipeInitialPageLoading } from '../../hooks/useWipeInitialPageLoading';
import { ConnectionStatusAlert } from '../connectionStatus/ConnectionStatusAlert';
import { finalStep, useSetupWizardStepsState } from './StepsState';
import { Epilogue } from './Epilogue';
import { SideBar } from './SideBar';
import { AdminUserInformationStep } from './steps/AdminUserInformationStep';
import { SettingsBasedStep } from './steps/SettingsBasedStep';
import { RegisterServerStep } from './steps/RegisterServerStep';

import './SetupWizardPage.css';

export function SetupWizardPage() {
	useWipeInitialPageLoading();
	const { currentStep = 1 } = useSetupWizardStepsState();
	const t = useTranslation();

	return <>
		<ConnectionStatusAlert />
		<div className='SetupWizard'>
			{(currentStep === finalStep && <Epilogue />)
			|| <>
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
				<div className='SetupWizard__wrapper'>
					<section className='SetupWizard__steps'>
						<AdminUserInformationStep step={1} title={t('Admin_Info')} active={currentStep === 1} />
						<SettingsBasedStep step={2} title={t('Organization_Info')} active={currentStep === 2} />
						<SettingsBasedStep step={3} title={t('Server_Info')} active={currentStep === 3} />
						<RegisterServerStep step={4} title={t('Register_Server')} active={currentStep === 4} />
					</section>
				</div>
			</>}
		</div>
	</>;
}
