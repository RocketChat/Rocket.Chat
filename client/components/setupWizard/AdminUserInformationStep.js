import React, { useContext, useEffect } from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { SetupWizardFormContext } from './SetupWizardForm';
import { Input } from '../basic/Input';

export function AdminUserInformationStep({
	active,
	formState: {
		name = {},
		username = {},
		email = {},
		pass = {},
	} = {},
}) {
	const t = useTranslation();
	const { setBackEnabled, setContinueEnabled } = useContext(SetupWizardFormContext);

	useEffect(() => {
		if (!active) {
			return;
		}

		setBackEnabled(false);
		setContinueEnabled(
			name.value && !name.invalid
			&& username.value && !username.invalid
			&& email.value && !email.invalid
			&& pass.value && !pass.invalid
		);
	}, [active, name, username, email, pass]);

	return <>
		<Input
			title={t('Name')}
			type='text'
			icon='user'
			placeholder={t('Type_your_name')}
			value={name.value || ''}
			onChange={({ currentTarget: { value } }) => name.setValue(value)}
		/>
		<Input
			title={t('Username')}
			type='text'
			icon='at'
			placeholder={t('Type_your_username')}
			value={username.value || ''}
			onChange={({ currentTarget: { value } }) => username.setValue(value)}
			error={username.invalid && t('Invalid_username')}
		/>
		<Input
			title={t('Organization_Email')}
			type='email'
			icon='mail'
			placeholder={t('Type_your_email')}
			value={email.value || ''}
			onChange={({ currentTarget: { value } }) => email.setValue(value)}
			error={email.invalid && t('Invalid_email')}
		/>
		<Input
			title={t('Password')}
			type='password'
			icon='key'
			placeholder={t('Type_your_password')}
			value={pass.value || ''}
			onChange={({ currentTarget: { value } }) => pass.setValue(value)}
		/>
	</>;
}
