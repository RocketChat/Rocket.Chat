import React, { useState } from 'react';

import { call } from '../../../../app/ui-utils/client';
import { handleError } from '../../../../app/utils/client';
import { useTranslation } from '../../../hooks/useTranslation';
import { Icon } from '../../basic/Icon';
import { Pager } from '../Pager';
import { useSetupWizardParameters } from '../ParametersProvider';
import { Step } from '../Step';
import { StepContent } from '../StepContent';
import { StepHeader } from '../StepHeader';
import { useSetupWizardStepsState } from '../StepsState';
import { batchSetSettings } from '../functions';

const RadioButton = ({ label, ...props }) =>
	<div className='SetupWizard__RegisterServerStep-radioButton'>
		<input type='radio' className='SetupWizard__RegisterServerStep-radioButtonInput' {...props} />
		<span className='SetupWizard__RegisterServerStep-radioButtonFake' />
		<span className='SetupWizard__RegisterServerStep-radioButtonLabel'>{label}</span>
	</div>;

const CheckBox = ({ label, ...props }) =>
	<label className='SetupWizard__RegisterServerStep-checkBox'>
		<input type='checkbox' className='SetupWizard__RegisterServerStep-checkBoxInput' {...props} />
		<span className='SetupWizard__RegisterServerStep-checkBoxFake'>
			<Icon icon='check' />
		</span>
		<span className='SetupWizard__RegisterServerStep-checkBoxLabel'>{label}</span>
	</label>;

const Option = ({ children, label, selected, disabled, ...props }) =>
	<label
		className={[
			'SetupWizard__RegisterServerStep-option',
			selected && 'SetupWizard__RegisterServerStep-option--selected',
			disabled && 'SetupWizard__RegisterServerStep-option--disabled',
		].filter(Boolean).join(' ')}
	>
		<RadioButton label={label} checked={selected} disabled={disabled} {...props} />
		{children}
	</label>;

const Items = (props) => <ul className='SetupWizard__RegisterServerStep-items' {...props} />;

const Item = ({ children, icon, ...props }) =>
	<li className='SetupWizard__RegisterServerStep-item' {...props}>
		<Icon block='SetupWizard__RegisterServerStep-item-icon' icon={icon} />
		{children}
	</li>;

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
		<StepHeader number={step} title={title} />

		<StepContent>
			<p className='SetupWizard__RegisterServerStep-text'>{t('Register_Server_Info')}</p>

			<div className='SetupWizard__RegisterServerStep-content'>
				<Option
					label={t('Register_Server_Registered')}
					name='registerServer'
					value='true'
					selected={registerServer}
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
						name='optInMarketingEmails'
						value='true'
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
					name='registerServer'
					value='false'
					disabled={!canDeclineServerRegistration}
					selected={!registerServer}
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
