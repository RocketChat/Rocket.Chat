import { Box, Margins, Scrollable, Tile } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useWipeInitialPageLoading } from '../../hooks/useWipeInitialPageLoading';
import { ConnectionStatusAlert } from '../connectionStatus/ConnectionStatusAlert';
import { finalStep } from './SetupWizardState';
import FinalStep from './steps/FinalStep';
import SideBar from './SideBar';
import AdminUserInformationStep from './steps/AdminUserInformationStep';
import SettingsBasedStep from './steps/SettingsBasedStep';
import RegisterServerStep from './steps/RegisterServerStep';

function SetupWizardPage({ currentStep = 1 }) {
	useWipeInitialPageLoading();

	const t = useTranslation();
	const small = useMediaQuery('(max-width: 760px)');

	return <>
		<ConnectionStatusAlert />
		<Box
			width='full'
			height='sh'
			display='flex'
			flexDirection={small ? 'column' : 'row'}
			alignItems='stretch'
			style={{ backgroundColor: 'var(--color-dark-05, #f1f2f4)' }}
			data-qa='setup-wizard'
		>
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
				<Box
					flexGrow={1}
					flexShrink={1}
					minHeight='none'
					display='flex'
					flexDirection='column'
				>
					<Scrollable>
						<Margins all='x16'>
							<Tile is='section' flexGrow={1} flexShrink={1}>
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

export default SetupWizardPage;
