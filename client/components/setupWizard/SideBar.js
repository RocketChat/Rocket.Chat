import { Box, Headline, Margins, Scrollable } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { Logo } from './Logo';
import './SideBar.css';

export function SideBar({
	logoSrc = 'images/logo/logo.svg',
	currentStep = 1,
	steps = [],
}) {
	const t = useTranslation();

	return <Box is='aside' className='SetupWizard__SideBar'>
		<header className='SetupWizard__SideBar-header'>
			<Logo className='SetupWizard__SideBar-headerLogo' src={logoSrc} />
			<span className='SetupWizard__SideBar-headerTag'>{t('Setup_Wizard')}</span>
		</header>

		<Scrollable>
			<Box className='SetupWizard__SideBar-content'>
				<Headline level={2}>{t('Setup_Wizard')}</Headline>
				<Margins blockEnd='16'>
					<Box is='p' textColor='hint' textStyle='p1'>{t('Setup_Wizard_Info')}</Box>
				</Margins>

				<ol className='SetupWizard__SideBar-steps'>
					{steps.map(({ step, title }) =>
						<li
							key={step}
							className={[
								'SetupWizard__SideBar-step',
								step === currentStep && 'SetupWizard__SideBar-step--active',
								step < currentStep && 'SetupWizard__SideBar-step--past',
							].filter(Boolean).join(' ')}
							data-number={step}
						>
							{title}
						</li>,
					)}
				</ol>
			</Box>
		</Scrollable>
	</Box>;
}
