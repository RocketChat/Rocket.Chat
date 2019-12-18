import React from 'react';
import styled from 'styled-components';

import { useTranslation } from '../../contexts/TranslationContext';
import { useWipeInitialPageLoading } from '../../hooks/useWipeInitialPageLoading';
import { ConnectionStatusAlert } from '../connectionStatus/ConnectionStatusAlert';
import { finalStep, useSetupWizardStepsState } from './StepsState';
import { Epilogue } from './Epilogue';
import { SideBar } from './SideBar';
import { AdminUserInformationStep } from './steps/AdminUserInformationStep';
import { SettingsBasedStep } from './steps/SettingsBasedStep';
import { RegisterServerStep } from './steps/RegisterServerStep';

const Container = styled.div`
	display: flex;
	width: 100%;
	height: 100vh;
	background-color: var(--color-dark-05, #f1f2f4);
	align-items: stretch;
	justify-content: stretch;

	@media (max-width: 760px) {
		flex-direction: column;
		justify-content: initial;
	}
`;

const Wrapper = styled.section`
	flex: 1 1 auto;
	height: 100vh;
	padding: 1rem;

	@media (max-width: 760px) {
		padding: 0;
	}
`;

const Steps = styled.div`
	overflow: auto;
	width: 100%;
	height: 100%;
	padding: 1rem 3rem;
	border-radius: 2px;
	background-color: var(--color-white, white);
	box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.08);
	justify-content: center;
`;

export function SetupWizardPage() {
	useWipeInitialPageLoading();
	const { currentStep } = useSetupWizardStepsState();
	const t = useTranslation();

	return <>
		<ConnectionStatusAlert />
		<Container>
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
				<Wrapper>
					<Steps>
						<AdminUserInformationStep step={1} title={t('Admin_Info')} active={currentStep === 1} />
						<SettingsBasedStep step={2} title={t('Organization_Info')} active={currentStep === 2} />
						<SettingsBasedStep step={3} title={t('Server_Info')} active={currentStep === 3} />
						<RegisterServerStep step={4} title={t('Register_Server')} active={currentStep === 4} />
					</Steps>
				</Wrapper>
			</>}
		</Container>
	</>;
}
