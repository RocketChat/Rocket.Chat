import React, { Fragment } from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../basic/Button';
import { Input } from '../basic/Input';
import { Icon } from '../basic/Icon';
import { SetupWizardStep } from './SetupWizardStep';
import { useSetupWizardState } from './SetupWizardState';
import { AdminUserInformationStep } from './steps/AdminUserInformationStep';

const Form = ({ children, ...props }) => <form className='setup-wizard-forms__wrapper' {...props}>
	{children}
</form>;

function SettingsBasedStep({ active, number, title, fields, onBackClick, onContinueClick }) {
	const t = useTranslation();

	return <SetupWizardStep loaded active={active}>
		<SetupWizardStep.Header number={number} title={title} />

		<SetupWizardStep.Content>
			{fields.map(({ id, type, label, value, options, setValue }, i) => <Fragment key={i}>
				{type === 'string'
				&& <Input
					type='text'
					title={t(label)}
					name={id}
					value={value}
					onChange={({ currentTarget: { value } }) => setValue(value)}
				/>}

				{type === 'select'
				&& <Input
					type='select'
					title={t(label)}
					name={id}
					placeholder={t('Select_an_option')}
					options={options.map(({ label, value }) => ({ label: t(label), value }))}
					value={value || ''}
					onChange={({ currentTarget: { value } }) => setValue(value)}
				/>}

				{type === 'language'
				&& <Input
					type='select'
					title={t(label)}
					name={id}
					placeholder={t('Default')}
					options={options}
					value={value || ''}
					onChange={({ currentTarget: { value } }) => setValue(value)}
				/>}
			</Fragment>)}

		</SetupWizardStep.Content>

		<SetupWizardStep.Footer>
			<Button secondary onClick={onBackClick}>
				{t('Back')}
			</Button>
			<Button primary onClick={onContinueClick}>
				{t('Continue')}
			</Button>
		</SetupWizardStep.Footer>
	</SetupWizardStep>;
}

const Paragraph = ({ children }) => <p className='setup-wizard-forms__content-text'>{children}</p>;

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

function RegisterServerStep({ active, formState: { registerServer, optIn }, allowStandaloneServer, onBackClick, onContinueClick }) {
	const t = useTranslation();

	return <SetupWizardStep loaded active={active}>
		<SetupWizardStep.Header number={4} title={t('Register_Server')} />

		<SetupWizardStep.Content>
			<Paragraph>{t('Register_Server_Info')}</Paragraph>

			<div className='setup-wizard-forms__content-register'>
				<Option
					label={t('Register_Server_Registered')}
					value='true'
					checked={registerServer.value}
					onChange={({ currentTarget: { checked } }) => {
						registerServer.setValue(checked);
						optIn.setValue(checked);
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
						disabled={!registerServer.value}
						checked={optIn.value}
						onChange={({ currentTarget: { checked } }) => {
							optIn.setValue(checked);
						}}
					/>
				</Option>
				<Option
					label={t('Register_Server_Standalone')}
					value='false'
					disabled={!allowStandaloneServer}
					checked={!registerServer.value}
					onChange={({ currentTarget: { checked } }) => {
						registerServer.setValue(!checked);
						optIn.setValue(!checked);
					}}
				>
					<Items>
						<Item icon='circle'>{t('Register_Server_Standalone_Service_Providers')}</Item>
						<Item icon='circle'>{t('Register_Server_Standalone_Update_Settings')}</Item>
						<Item icon='circle'>{t('Register_Server_Standalone_Own_Certificates')}</Item>
					</Items>
				</Option>
			</div>
		</SetupWizardStep.Content>

		<SetupWizardStep.Footer>
			<Button secondary onClick={onBackClick}>
				{t('Back')}
			</Button>
			<Button submit primary onClick={onContinueClick}>
				{t('Continue')}
			</Button>
		</SetupWizardStep.Footer>
	</SetupWizardStep>;
}

export function SetupWizardForm() {
	const t = useTranslation();
	const {
		currentStepNumber,
		steps,
		formState,
		allowStandaloneServer,
		handleBackClick,
		handleContinueClick,
	} = useSetupWizardState();
	const currentStepIndex = currentStepNumber - 1;

	const handleSubmit = (event) => {
		event.preventDefault();
		event.stopPropagation();
	};

	return <section className='setup-wizard-forms'>
		<Form noValidate onSubmit={handleSubmit}>
			<AdminUserInformationStep />
			<SettingsBasedStep
				active={currentStepIndex === 1}
				number={2}
				title={t('Organization_Info')}
				fields={Object.values(formState).filter((setting) => setting.step === steps[1])}
				onBackClick={handleBackClick}
				onContinueClick={handleContinueClick}
			/>
			<SettingsBasedStep
				active={currentStepIndex === 2}
				number={3}
				title={t('Server_Info')}
				fields={Object.values(formState).filter((setting) => setting.step === steps[2])}
				onBackClick={handleBackClick}
				onContinueClick={handleContinueClick}
			/>
			<RegisterServerStep
				active={currentStepIndex === 3}
				formState={formState}
				allowStandaloneServer={allowStandaloneServer}
				onBackClick={handleBackClick}
				onContinueClick={handleContinueClick}
			/>
		</Form>
	</section>;
}
