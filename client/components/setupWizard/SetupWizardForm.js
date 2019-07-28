import React, { createContext, useMemo, useState } from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../basic/Button';
import { AdminUserInformationStep } from './AdminUserInformationStep';
import { SettingsBasedStep } from './SettingsBasedStep';
import { RegisterServerStep } from './RegisterServerStep';

const Wrapper = ({ children }) => <div className='setup-wizard-forms__wrapper'>
	{children}
</div>;

const Form = ({ children, loaded, onSubmit }) => <form
	className={[
		'setup-wizard-forms__box',
		loaded && 'setup-wizard-forms__box--loaded',
	].filter(Boolean).join(' ')}
	noValidate
	onSubmit={onSubmit}
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

const ContentStep = ({ children, active }) => <div
	className={[
		'setup-wizard-forms__content-step',
		active && 'setup-wizard-forms__content-step--active',
	].filter(Boolean).join(' ')}
>
	{children}
</div>;

const Footer = ({ children }) => <footer className='setup-wizard-forms__footer'>
	{children}
</footer>;

export const SetupWizardFormContext = createContext();

export function SetupWizardForm({ steps, currentStep, formState, allowStandaloneServer, handleBackClick, handleContinueClick }) {
	const t = useTranslation();
	const [isBackEnabled, setBackEnabled] = useState(false);
	const [isContinueEnabled, setContinueEnabled] = useState(false);

	const currentStepNumber = useMemo(() => steps.indexOf(currentStep) + 1, [steps, currentStep]);
	const currentStepIndex = useMemo(() => steps.indexOf(currentStep), [steps, currentStep]);

	const handleSubmit = (event) => {
		event.preventDefault();
		event.stopPropagation();
		handleContinueClick();
	};

	return <SetupWizardFormContext.Provider value={{ setBackEnabled, setContinueEnabled }}>
		<section className='setup-wizard-forms'>
			<Wrapper>
				<Form loaded onSubmit={handleSubmit}>
					<Header>
						<HeaderStep>{t('Step')} {currentStepNumber}</HeaderStep>
						<HeaderTitle>{t(currentStep.title)}</HeaderTitle>
					</Header>

					<Content>
						<ContentStep active={currentStepIndex === 0}>
							<AdminUserInformationStep active={currentStepIndex === 0} formState={formState} />
						</ContentStep>
						<ContentStep active={currentStepIndex === 1}>
							<SettingsBasedStep active={currentStepIndex === 1} formState={formState} step={steps[1]} />
						</ContentStep>
						<ContentStep active={currentStepIndex === 2}>
							<SettingsBasedStep active={currentStepIndex === 2} formState={formState} step={steps[2]} />
						</ContentStep>
						<ContentStep active={currentStepIndex === 3}>
							<RegisterServerStep active={currentStepIndex === 3} formState={formState} allowStandaloneServer={allowStandaloneServer} />
						</ContentStep>
					</Content>

					<Footer>
						<Button secondary disabled={!isBackEnabled} onClick={handleBackClick}>
							{t('Back')}
						</Button>
						<Button submit primary disabled={!isContinueEnabled} onClick={handleContinueClick}>
							{t('Continue')}
						</Button>
					</Footer>
				</Form>
			</Wrapper>
		</section>
	</SetupWizardFormContext.Provider>;
}
