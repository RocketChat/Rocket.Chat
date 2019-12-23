import { Box, Margins, Scrollable, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useWipeInitialPageLoading } from '../../hooks/useWipeInitialPageLoading';
import { ConnectionStatusAlert } from '../connectionStatus/ConnectionStatusAlert';
import { finalStep } from './SetupWizardState';
import { FinalStep } from './steps/FinalStep';
import { SideBar } from './SideBar';
import { AdminUserInformationStep } from './steps/AdminUserInformationStep';
import { SettingsBasedStep } from './steps/SettingsBasedStep';
import { RegisterServerStep } from './steps/RegisterServerStep';

import './SetupWizardPage.css';

export function SetupWizardPage({ currentStep = 1 }) {
	useWipeInitialPageLoading();
	const t = useTranslation();

	return <>
		<ConnectionStatusAlert />
		<Box componentClassName='SetupWizard'>
			{(currentStep === finalStep && <FinalStep />)
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
				<Box className='SetupWizard__wrapper'>
					<Scrollable>
						<Margins all='16'>
							<Tile is='section' className='SetupWizard__steps'>
								<AdminUserInformationStep step={1} title={t('Admin_Info')} active={currentStep === 1} />
								<SettingsBasedStep step={2} title={t('Organization_Info')} active={currentStep === 2} />
								<SettingsBasedStep step={3} title={t('Server_Info')} active={currentStep === 3} />
								<RegisterServerStep step={4} title={t('Register_Server')} active={currentStep === 4} />
							</Tile>
						</Margins>
					</Scrollable>
				</Box>
			</>}
		</Box>
	</>;
}
