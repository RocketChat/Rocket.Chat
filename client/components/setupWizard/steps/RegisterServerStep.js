import React, { useState } from 'react';

import { settings } from '../../../../app/settings/lib/settings';
import { call } from '../../../../app/ui-utils/client';
import { handleError } from '../../../../app/utils/client';
import { useTranslation } from '../../../hooks/useTranslation';
import { Icon } from '../../basic/Icon';
import { useSetupWizardStepsState } from '../StepsState';
import { Step } from '../Step';
import { StepHeader } from '../StepHeader';
import { StepContent } from '../StepContent';
import { Pager } from '../Pager';
import { useSetupWizardParameters } from '../ParametersProvider';

const Paragraph = (props) => <p className='setup-wizard-forms__content-text' {...props} />;

const Option = ({ children, value, checked, disabled, label, onChange }) => <label
	className={[
		'setup-wizard-forms__content-register-option',
		checked && 'setup-wizard-forms__content-register-option--selected',
		disabled && 'setup-wizard-forms__content-register-option--disabled',
	].filter(Boolean).join(' ')}
>
	<div className='setup-wizard-forms__content-register-radio'>
		<input type='radio' name='registerServer' value={value} className='setup-wizard-forms__content-register-radio-element' checked={checked} onChange={onChange}/>
		<span className='setup-wizard-forms__content-register-radio-fake' />
		<span className='setup-wizard-forms__content-register-radio-text'>{label}</span>
	</div>
	{children}
</label>;

const Items = ({ children }) => <ul className='setup-wizard-forms__content-register-items'>
	{children}
</ul>;

const Item = ({ children, icon }) => <li className='setup-wizard-forms__content-register-item'>
	<Icon block='setup-wizard-forms__content-register-radio-icon' icon={icon} />
	{children}
</li>;

const CheckBox = ({ checked, disabled, label, onChange }) => <label className='setup-wizard-forms__content-register-checkbox'>
	<input type='checkbox' name='optIn' value='true' className='setup-wizard-forms__content-register-checkbox-element' checked={checked} disabled={disabled} onChange={onChange}/>
	<span className='setup-wizard-forms__content-register-checkbox-fake'>
		<Icon block='setup-wizard-forms__content-register-checkbox-fake-icon' icon='check' />
	</span>
	<span className='setup-wizard-forms__content-register-checkbox-text'>{label}</span>
</label>;

const batchSetSettings = (values) => new Promise((resolve, reject) => settings.batchSet(values, (error) => {
	if (error) {
		reject(error);
		return;
	}

	resolve();
}));

export function RegisterServerStep({ step, title }) {
	const { canDeclineServerRegistration } = useSetupWizardParameters();
	const { currentStep, goToPreviousStep, goToFinalStep } = useSetupWizardStepsState();

	const active = step === currentStep;

	const [registerServer, setRegisterServer] = useState(true);
	const [optInMarketingEmails, setOptInMarketingEmails] = useState(true);

	const t = useTranslation();

	const [commiting, setComitting] = useState(false);

	const handleBackClick = () => {
		goToPreviousStep();
	};

	const handleContinueClick = async () => {
		setComitting(true);

		try {
			await batchSetSettings([
				{
					_id: 'Statistics_reporting',
					value: registerServer,
				},
				{
					_id: 'Apps_Framework_enabled',
					value: registerServer,
				},
				{
					_id: 'Register_Server',
					value: registerServer,
				},
				{
					_id: 'Allow_Marketing_Emails',
					value: optInMarketingEmails,
				},
			]);

			if (registerServer) {
				await call('cloud:registerWorkspace');
			}

			setComitting(false);
			goToFinalStep();
		} catch (error) {
			console.error(error);
			handleError(error);
			setComitting(false);
		}
	};

	return <Step active={active} working={commiting}>
		<StepHeader step={step} title={title} />

		<StepContent>
			<Paragraph>{title}</Paragraph>

			<div className='setup-wizard-forms__content-register'>
				<Option
					label={t('Register_Server_Registered')}
					value='true'
					checked={registerServer}
					onChange={({ currentTarget: { checked } }) => {
						setRegisterServer(checked);
						setOptInMarketingEmails(checked);
					}}
				>
					<Items>
						<Item icon='check'>{t('Register_Server_Registered_Push_Notifications')}</Item>
						<Item icon='check'>{t('Register_Server_Registered_Livechat')}</Item>
						<Item icon='check'>{t('Register_Server_Registered_OAuth')}</Item>
						<Item icon='check'>{t('Register_Server_Registered_Marketplace')}</Item>
					</Items>
					<CheckBox
						label={t('Register_Server_Opt_In')}
						disabled={!registerServer}
						checked={optInMarketingEmails}
						onChange={({ currentTarget: { checked } }) => {
							setOptInMarketingEmails(checked);
						}}
					/>
				</Option>
				<Option
					label={t('Register_Server_Standalone')}
					value='false'
					disabled={!canDeclineServerRegistration}
					checked={!registerServer}
					onChange={({ currentTarget: { checked } }) => {
						setRegisterServer(!checked);
						setOptInMarketingEmails(!checked);
					}}
				>
					<Items>
						<Item icon='circle'>{t('Register_Server_Standalone_Service_Providers')}</Item>
						<Item icon='circle'>{t('Register_Server_Standalone_Update_Settings')}</Item>
						<Item icon='circle'>{t('Register_Server_Standalone_Own_Certificates')}</Item>
					</Items>
				</Option>
			</div>
		</StepContent>

		<Pager disabled={commiting} onBackClick={handleBackClick} onContinueClick={handleContinueClick} />
	</Step>;
}
