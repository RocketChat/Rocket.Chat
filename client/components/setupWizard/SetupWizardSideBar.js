import React, { useMemo } from 'react';

import { useTranslation } from '../../hooks/useTranslation';

const Header = ({ children }) => <header className='setup-wizard-info__header'>
	{children}
</header>;

const HeaderLogo = () => <img className='setup-wizard-info__header-logo' src='images/logo/logo.svg' />;

const HeaderTag = ({ children }) => <span className='setup-wizard-info__header-tag'>{children}</span>;

const Content = ({ children }) => <div className='setup-wizard-info__content'>
	{children}
</div>;

const ContentTitle = ({ children }) => <h1 className='setup-wizard-info__content-title'>{children}</h1>;

const ContentText = ({ children }) => <p className='setup-wizard-info__content-text'>{children}</p>;

const Steps = ({ children }) => <ol className='setup-wizard-info__steps'>
	{children}
</ol>;

const Step = ({ children, active, past, boundAbove }) => <li className={[
	'setup-wizard-info__steps-item',
	active && 'setup-wizard-info__steps-item--active',
	past && 'setup-wizard-info__steps-item--past',
].filter(Boolean).join(' ')}>
	{children}
	{boundAbove && <span className='setup-wizard-info__steps-item-bonding' />}
</li>;

export function SetupWizardSideBar({ steps = [], currentStep }) {
	const t = useTranslation();
	const currentStepIndex = useMemo(() => steps.indexOf(currentStep), [steps, currentStep]);

	return <section className='setup-wizard-info'>
		<Header>
			<HeaderLogo />
			<HeaderTag>{t('Setup_Wizard')}</HeaderTag>
		</Header>

		<Content>
			<ContentTitle>{t('Setup_Wizard')}</ContentTitle>
			<ContentText>{t('Setup_Wizard_Info')}</ContentText>

			<Steps>
				{steps.map((step, i) => <Step
					key={i}
					active={currentStepIndex === i}
					past={currentStepIndex > i}
					boundAbove={i > 0}
				>
					{t(step.title)}
				</Step>)}
			</Steps>
		</Content>
	</section>;
}
