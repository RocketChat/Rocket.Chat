import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { useSetupWizardStepsState } from './StepsState';
import './SideBar.css';

const Container = (props) => <aside className='SetupWizard__SideBar' {...props} />;

const Header = (props) => <header className='SetupWizard__SideBar-header' {...props} />;

const HeaderLogo = (props) => <img className='SetupWizard__SideBar-headerLogo' src='images/logo/logo.svg' {...props} />;

const HeaderTag = (props) => <span className='SetupWizard__SideBar-headerTag' {...props} />;

const Content = (props) => <div className='.SetupWizard__SideBar-content' {...props} />;

const Title = (props) => <h2 className='SetupWizard__SideBar-title' {...props} />;

const Text = (props) => <p className='SetupWizard__SideBar-text' {...props} />;

const Steps = (props) => <ol className='SetupWizard__SideBar-steps' {...props} />;

const Step = ({ children, number, active, past, ...props }) =>
	<li
		className={[
			'SetupWizard__SideBar-step',
			active && 'SetupWizard__SideBar-step--active',
			past && 'SetupWizard__SideBar-step--past',
		].filter(Boolean).join(' ')}
		data-number={number}
		{...props}
	>
		{children}
	</li>;

export function SideBar({ steps = [] }) {
	const { currentStep } = useSetupWizardStepsState();

	const t = useTranslation();

	return <Container>
		<Header>
			<HeaderLogo />
			<HeaderTag>{t('Setup_Wizard')}</HeaderTag>
		</Header>

		<Content>
			<Title>{t('Setup_Wizard')}</Title>
			<Text>{t('Setup_Wizard_Info')}</Text>

			<Steps>
				{steps.map(({ step, title }) =>
					<Step
						key={step}
						number={step}
						active={step === currentStep}
						past={step < currentStep}
					>
						{title}
					</Step>
				)}
			</Steps>
		</Content>
	</Container>;
}
