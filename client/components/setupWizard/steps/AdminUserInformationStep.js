import {
	EmailInput,
	Field,
	FieldGroup,
	Icon,
	Label,
	Margins,
	PasswordInput,
	TextInput,
} from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState } from 'react';

import { useMethod } from '../../../contexts/ServerContext';
import { useSessionDispatch } from '../../../contexts/SessionContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useLoginWithPassword } from '../../../contexts/UserContext';
import { useCallbacks } from '../../../hooks/useCallbacks';
import { useFocus } from '../../../hooks/useFocus';
import { Pager } from '../Pager';
import { Step } from '../Step';
import { StepHeader } from '../StepHeader';

export function AdminUserInformationStep({ step, title, active }) {
	const loginWithPassword = useLoginWithPassword();
	const registerUser = useMethod('registerUser');
	const defineUsername = useMethod('setUsername');

	const setForceLogin = useSessionDispatch('forceLogin');
	const callbacks = useCallbacks();
	const dispatchToastMessage = useToastMessageDispatch();

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
			dispatchToastMessage({ type: 'error', message: error });
			throw error;
		}

		setForceLogin(false);

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
				onRegistrationEmailSent: () => {
					dispatchToastMessage({ type: 'success', message: t('We_have_sent_registration_email') });
				},
			});
		} catch (error) {
			console.error(error);
		} finally {
			setCommiting(false);
		}
	};

	const nameInputId = useUniqueId();
	const usernameInputId = useUniqueId();
	const emailInputId = useUniqueId();
	const passwordInputId = useUniqueId();

	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='32'>
			<FieldGroup>
				<Field>
					<Label htmlFor={nameInputId} required text={t('Name')} />
					<TextInput
						ref={autoFocusRef}
						id={nameInputId}
						addon={<Icon name='user' size='20' />}
						placeholder={t('Type_your_name')}
						value={name}
						onChange={({ currentTarget: { value } }) => setName(value)}
						error={!isNameValid}
					/>
				</Field>
				<Field>
					<Label htmlFor={usernameInputId} required text={t('Username')} />
					<TextInput
						id={usernameInputId}
						addon={<Icon name='at' size='20' />}
						placeholder={t('Type_your_username')}
						value={username}
						onChange={({ currentTarget: { value } }) => setUsername(value)}
						error={!isUsernameValid}
					/>
					{!isUsernameValid && <Field.Error>{t('Invalid_username')}</Field.Error>}
				</Field>
				<Field>
					<Label htmlFor={emailInputId} required text={t('Organization_Email')} />
					<EmailInput
						id={emailInputId}
						addon={<Icon name='mail' size='20' />}
						placeholder={t('Type_your_email')}
						value={email}
						onChange={({ currentTarget: { value } }) => setEmail(value)}
						error={!isEmailValid}
					/>
					{!isEmailValid && <Field.Error>{t('Invalid_email')}</Field.Error>}
				</Field>
				<Field>
					<Label htmlFor={passwordInputId} required text={t('Password')} />
					<PasswordInput
						id={passwordInputId}
						addon={<Icon name='key' size='20' />}
						placeholder={t('Type_your_password')}
						value={password}
						onChange={({ currentTarget: { value } }) => setPassword(value)}
						error={!isPasswordValid}
					/>
				</Field>
			</FieldGroup>
		</Margins>

		<Pager disabled={commiting} isContinueEnabled={isContinueEnabled} />
	</Step>;
}
