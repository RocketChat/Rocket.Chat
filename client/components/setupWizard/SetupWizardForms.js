import React, { useMemo } from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../basic/Button';
import { AdminUserInformationStep } from './AdminUserInformationStep';
import { SettingsBasedStep } from './SettingsBasedStep';
import { RegisterServerStep } from './RegisterServerStep';

const Wrapper = ({ children }) => <div className='setup-wizard-forms__wrapper'>
	{children}
</div>;

const Form = ({ children, loaded }) => <form
	className={[
		'setup-wizard-forms__box',
		loaded && 'setup-wizard-forms__box--loaded',
	].filter(Boolean).join(' ')}
	noValidate
>
	{children}
</form>;

const Header = ({ children }) => <header className='setup-wizard-forms__header'>
	{children}
</header>;

const HeaderStep = ({ children }) => <span className='setup-wizard-forms__header-step'>{children}</span>;

const HeaderTitle = ({ children }) => <h1 className='setup-wizard-forms__header-title'>{children}</h1>;

const Content = ({ children }) => <main className='setup-wizard-forms__content'>
	{children}
</main>;

const Footer = ({ children }) => <footer className='setup-wizard-forms__footer'>
	{children}
</footer>;

export function SetupWizardForms({ steps, currentStep, formState, allowStandaloneServer }) {
	const t = useTranslation();
	const currentStepNumber = useMemo(() => steps.indexOf(currentStep) + 1, [steps, currentStep]);
	const currentStepIndex = useMemo(() => steps.indexOf(currentStep), [steps, currentStep]);
	const showBackButton = useMemo(() => {
		switch (currentStepIndex) {
			case 2:
			case 3:
				return true;
		}

		return false;
	}, [currentStepIndex]);
	const isContinueDisabled = useMemo(() => {
		switch (currentStepIndex) {
			case 0:
				return !(formState.name && formState.name.value)
					|| !(formState.username && formState.username.value)
					|| !(formState.email && formState.email.value)
					|| !(formState.pass && formState.pass.value);
		}

		return false;
	}, [currentStepIndex, formState]);

	return <section className='setup-wizard-forms'>
		<Wrapper>
			<Form loaded>
				<Header>
					<HeaderStep>{t('Step')} {currentStepNumber}</HeaderStep>
					<HeaderTitle>{t(currentStep.title)}</HeaderTitle>
				</Header>

				<Content>
					<AdminUserInformationStep active={currentStepIndex === 0} formState={formState} />
					<SettingsBasedStep active={currentStepIndex === 1} formState={formState} step={steps[1]} />
					<SettingsBasedStep active={currentStepIndex === 2} formState={formState} step={steps[2]} />
					<RegisterServerStep active={currentStepIndex === 3} formState={formState} allowStandaloneServer={allowStandaloneServer} />
				</Content>

				<Footer>
					{showBackButton && <Button secondary className='setup-wizard-forms__footer-back'>
						{t('Back')}
					</Button>}
					<Button submit primary disabled={isContinueDisabled} className='setup-wizard-forms__footer-next'>
						{t('Continue')}
					</Button>
				</Footer>
			</Form>
		</Wrapper>
	</section>;
}
