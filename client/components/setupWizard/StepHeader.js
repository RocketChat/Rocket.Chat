import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';

const Header = (props) => <header className='setup-wizard-forms__header' {...props} />;

const HeaderStep = (props) => <span className='setup-wizard-forms__header-step' {...props} />;

const HeaderTitle = (props) => <h1 className='setup-wizard-forms__header-title' {...props} />;

export function StepHeader({ step, title }) {
	const t = useTranslation();

	return <Header>
		<HeaderStep>{t('Step')} {step}</HeaderStep>
		<HeaderTitle>{title}</HeaderTitle>
	</Header>;
}
