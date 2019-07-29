import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';

const Box = ({ children, loaded, active }) => <section
	className={[
		'setup-wizard-forms__box',
		loaded && 'setup-wizard-forms__box--loaded',
	].filter(Boolean).join(' ')}
	{...!active && { style: { display: 'none' } }}
>
	{children}
</section>;

const Header = ({ children }) => <header className='setup-wizard-forms__header'>
	{children}
</header>;

const HeaderStep = ({ children }) => <span className='setup-wizard-forms__header-step'>{children}</span>;

const HeaderTitle = ({ children }) => <h1 className='setup-wizard-forms__header-title'>{children}</h1>;

const Content = ({ children }) => <section className='setup-wizard-forms__content'>
	<div className='setup-wizard-forms__content-step setup-wizard-forms__content-step--active'>
		{children}
	</div>
</section>;

const Footer = ({ children }) => <footer className='setup-wizard-forms__footer'>
	{children}
</footer>;

export const SetupWizardStep = (props) => <Box {...props} />;

SetupWizardStep.Header = ({ number, title }) => {
	const t = useTranslation();
	return <Header>
		<HeaderStep>{t('Step')} {number}</HeaderStep>
		<HeaderTitle>{title}</HeaderTitle>
	</Header>;
};

SetupWizardStep.Content = (props) => <Content {...props} />;

SetupWizardStep.Footer = (props) => <Footer {...props} />;
