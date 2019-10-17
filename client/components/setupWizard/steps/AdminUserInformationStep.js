import {
	EmailInput,
	Field,
	FieldGroup,
	Icon,
	Label,
	PasswordInput,
	TextInput,
} from '@rocket.chat/fuselage';
import { Session } from 'meteor/session';
import React, { useMemo, useState } from 'react';
import toastr from 'toastr';

import { handleError } from '../../../../app/utils/client';
import { callbacks } from '../../../../app/callbacks/client';
import { useFocus } from '../../../hooks/useFocus';
import { useLoginWithPassword } from '../../../hooks/useLoginWithPassword';
import { useMethod } from '../../../hooks/useMethod';
import { useSetting } from '../../../hooks/useSetting';
import { useTranslation } from '../../../hooks/useTranslation';
import { useSetupWizardStepsState } from '../StepsState';
import { Step } from '../Step';
import { StepHeader } from '../StepHeader';
import { Pager } from '../Pager';
import { StepContent } from '../StepContent';

export function AdminUserInformationStep({ step, title, active }) {
	const { goToNextStep } = useSetupWizardStepsState();

	const loginWithPassword = useLoginWithPassword();
	const registerUser = useMethod('registerUser');
	const defineUsername = useMethod('setUsername');

	const registerAdminUser = async ({ name, username, email, password, onRegistrationEmailSent }) => {
		await registerUser({ name, username, email, pass: password });
		callbacks.run('userRegistered');

		try {
			await loginWithPassword(email, password);
		} catch (error) {
			if (error.error === 'error-invalid-email') {
				onRegistrationEmailSent && onRegistrationEmailSent();
				return;
			}
			handleError(error);
			throw error;
		}

		Session.set('forceLogin', false);

		await defineUsername(username);

		callbacks.run('usernameSet');
	};

	const regexpForUsernameValidation = useSetting('UTF8_Names_Validation');
	const usernameRegExp = useMemo(() => new RegExp(`^${ regexpForUsernameValidation }$`), [regexpForUsernameValidation]);
	const emailRegExp = useMemo(() => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/i, []);

	const [name, setName] = useState('');
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const [isNameValid, validateName] = useState(true);
	const [isUsernameValid, validateUsername] = useState(true);
	const [isEmailValid, validateEmail] = useState(true);
	const [isPasswordValid, validatePassword] = useState(true);

	const isContinueEnabled = useMemo(() => name && username && email && password, [name, username, email, password]);

	const [commiting, setCommiting] = useState(false);

	const validate = () => {
		const isNameValid = !!name;
		const isUsernameValid = !!username && usernameRegExp.test(username);
		const isEmailValid = !!email && emailRegExp.test(email);
		const isPasswordValid = !!password;

		validateName(isNameValid);
		validateUsername(isUsernameValid);
		validateEmail(isEmailValid);
		validatePassword(isPasswordValid);

		return isNameValid && isUsernameValid && isEmailValid && isPasswordValid;
	};

	const t = useTranslation();

	const autoFocusRef = useFocus(active);

	const handleSubmit = async (event) => {
		event.preventDefault();

		const canRegisterAdminUser = validate();

		if (!canRegisterAdminUser) {
			return;
		}

		setCommiting(true);

		try {
			await registerAdminUser({
				name,
				username,
				email,
				password,
				onRegistrationEmailSent: () => toastr.success(t('We_have_sent_registration_email')),
			});
			goToNextStep();
		} catch (error) {
			console.error(error);
		} finally {
			setCommiting(false);
		}
	};

	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<StepContent>
			<FieldGroup>
				<Field>
					<Label text={t('Name')}>
						<TextInput
							ref={autoFocusRef}
							addon={<Icon name='user' />}
							placeholder={t('Type_your_name')}
							value={name}
							onChange={({ currentTarget: { value } }) => setName(value)}
							error={!isNameValid}
						/>
					</Label>
				</Field>
				<Field>
					<Label text={t('Username')} error={!isUsernameValid && t('Invalid_username')}>
						<TextInput
							addon={<Icon name='at' />}
							placeholder={t('Type_your_username')}
							value={username}
							onChange={({ currentTarget: { value } }) => setUsername(value)}
							error={!isUsernameValid}
						/>
					</Label>
				</Field>
				<Field>
					<Label text={t('Organization_Email')} error={!isEmailValid && t('Invalid_email')}>
						<EmailInput
							addon={<Icon name='mail' />}
							placeholder={t('Type_your_email')}
							value={email}
							onChange={({ currentTarget: { value } }) => setEmail(value)}
							error={!isEmailValid}
						/>
					</Label>
				</Field>
				<Field>
					<Label text={t('Password')}>
						<PasswordInput
							type='password'
							addon={<Icon name='key' />}
							placeholder={t('Type_your_password')}
							value={password}
							onChange={({ currentTarget: { value } }) => setPassword(value)}
							error={!isPasswordValid}
						/>
					</Label>
				</Field>
			</FieldGroup>
		</StepContent>

		<Pager disabled={commiting} isContinueEnabled={isContinueEnabled} />
	</Step>;
}
