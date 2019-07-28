import React, { useContext, useEffect } from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { Icon } from '../basic/Icon';
import { SetupWizardFormContext } from './SetupWizardForm';

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

export function RegisterServerStep({ active, formState: { registerServer, optIn }, allowStandaloneServer }) {
	const t = useTranslation();

	const { setBackEnabled, setContinueEnabled } = useContext(SetupWizardFormContext);

	useEffect(() => {
		if (!active) {
			return;
		}

		setBackEnabled(true);
		setContinueEnabled(true);
	}, [active]);

	return <>
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
	</>;
}
