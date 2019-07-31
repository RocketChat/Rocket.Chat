import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { useSetupWizardStepsState } from './StepsState';

const Container = (props) => <aside className='setup-wizard-info' {...props} />;

const Header = (props) => <header className='setup-wizard-info__header' {...props} />;

const HeaderLogo = (props) => <img className='setup-wizard-info__header-logo' src='images/logo/logo.svg' {...props} />;

const HeaderTag = (props) => <span className='setup-wizard-info__header-tag' {...props} />;

const Content = (props) => <div className='setup-wizard-info__content' {...props} />;

const ContentTitle = (props) => <h1 className='setup-wizard-info__content-title' {...props} />;

const ContentText = (props) => <p className='setup-wizard-info__content-text' {...props} />;

const Steps = (props) => <ol className='setup-wizard-info__steps' {...props} />;

const Step = ({ children, active, past, boundAbove, ...props }) =>
	<li
		className={[
			'setup-wizard-info__steps-item',
			active && 'setup-wizard-info__steps-item--active',
			past && 'setup-wizard-info__steps-item--past',
		].filter(Boolean).join(' ')}
		{...props}
	>
		{children}
		{boundAbove && <span className='setup-wizard-info__steps-item-bonding' />}
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
			<ContentTitle>{t('Setup_Wizard')}</ContentTitle>
			<ContentText>{t('Setup_Wizard_Info')}</ContentText>

			<Steps>
				{steps.map(({ step, title }) =>
					<Step
						key={step}
						active={step === currentStep}
						past={step < currentStep}
						boundAbove={step > 1}
					>
						{title}
					</Step>
				)}
			</Steps>
		</Content>
	</Container>;
}
