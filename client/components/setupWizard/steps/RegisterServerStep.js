import { CheckBox, Label, RadioButton } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import React, { useRef, useState } from 'react';

import { handleError } from '../../../../app/utils/client';
import { useBatchSetSettings } from '../../../hooks/useBatchSetSettings';
import { useFocus } from '../../../hooks/useFocus';
import { useMethod } from '../../../hooks/useMethod';
import { Icon } from '../../basic/Icon';
import { useTranslation } from '../../providers/TranslationProvider';
import { Pager } from '../Pager';
import { useSetupWizardParameters } from '../ParametersProvider';
import { Step } from '../Step';
import { StepContent } from '../StepContent';
import { StepHeader } from '../StepHeader';
import { useSetupWizardStepsState } from '../StepsState';
import './RegisterServerStep.css';

const Option = React.forwardRef(({ children, label, selected, disabled, ...props }, ref) => {
	const innerRef = useRef();
	const mergedRef = useMergedRefs(ref, innerRef);

	return <span
		className={[
			'SetupWizard__RegisterServerStep-option',
			selected && 'SetupWizard__RegisterServerStep-option--selected',
			disabled && 'SetupWizard__RegisterServerStep-option--disabled',
		].filter(Boolean).join(' ')}
		onClick={() => {
			innerRef.current.click();
		}}
	>
		<Label text={label} position='end'>
			<RadioButton ref={mergedRef} checked={selected} disabled={disabled} {...props} />
		</Label>
		{children}
	</span>;
});

const Items = (props) => <ul className='SetupWizard__RegisterServerStep-items' {...props} />;

const Item = ({ children, icon, ...props }) =>
	<li className='SetupWizard__RegisterServerStep-item' {...props}>
		<Icon block='SetupWizard__RegisterServerStep-item-icon' icon={icon} />
		{children}
	</li>;

export function RegisterServerStep({ step, title, active }) {
	const { canDeclineServerRegistration } = useSetupWizardParameters();
	const { goToPreviousStep, goToFinalStep } = useSetupWizardStepsState();

	const [registerServer, setRegisterServer] = useState(true);
	const [optInMarketingEmails, setOptInMarketingEmails] = useState(true);

	const t = useTranslation();

	const [commiting, setComitting] = useState(false);

	const batchSetSettings = useBatchSetSettings();

	const registerCloudWorkspace = useMethod('cloud:registerWorkspace');

	const handleBackClick = () => {
		goToPreviousStep();
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

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
				await registerCloudWorkspace();
			}

			setComitting(false);
			goToFinalStep();
		} catch (error) {
			console.error(error);
			handleError(error);
			setComitting(false);
		}
	};

	const autoFocusRef = useFocus(active);

	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<StepContent>
			<p className='SetupWizard__RegisterServerStep-text'>{t('Register_Server_Info')}</p>

			<div className='SetupWizard__RegisterServerStep-content'>
				<Option
					ref={autoFocusRef}
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
					<Label text={t('Register_Server_Opt_In')} position='end' className='SetupWizard__RegisterServerStep__optIn'>
						<CheckBox
							name='optInMarketingEmails'
							value='true'
							disabled={!registerServer}
							checked={optInMarketingEmails}
							onChange={({ currentTarget: { checked } }) => {
								setOptInMarketingEmails(checked);
							}}
						/>
					</Label>
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

		<Pager disabled={commiting} onBackClick={handleBackClick} />
	</Step>;
}
