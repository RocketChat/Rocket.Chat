import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { useSetupWizardState } from './SetupWizardState';

const Container = ({ children }) => <aside className='setup-wizard-info'>
	{children}
</aside>;

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

export function SetupWizardSideBar() {
	const t = useTranslation();
	const { currentStepNumber, steps } = useSetupWizardState();

	return <Container>
		<Header>
			<HeaderLogo />
			<HeaderTag>{t('Setup_Wizard')}</HeaderTag>
		</Header>

		<Content>
			<ContentTitle>{t('Setup_Wizard')}</ContentTitle>
			<ContentText>{t('Setup_Wizard_Info')}</ContentText>

			<Steps>
				{steps.map(({ number, i18nTitleKey }) => <Step
					key={number}
					active={currentStepNumber === number}
					past={currentStepNumber > number}
					boundAbove={number > 1}
				>
					{t(i18nTitleKey)}
				</Step>)}
			</Steps>
		</Content>
	</Container>;
}
