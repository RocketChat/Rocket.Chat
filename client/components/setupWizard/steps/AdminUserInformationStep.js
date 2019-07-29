import React, { useMemo, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import toastr from 'toastr';

import { handleError } from '../../../../app/utils/client';
import { callbacks } from '../../../../app/callbacks/client';
import { useSetting } from '../../../hooks/useSetting';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../basic/Button';
import { Input } from '../../basic/Input';
import { useSetupWizardState } from '../SetupWizardState';
import { SetupWizardStep } from '../SetupWizardStep';
import { call } from '../../../../app/ui-utils/client';
import { useSession } from '../../../hooks/useSession';

export function AdminUserInformationStep() {
	const t = useTranslation();
	const [regexpForUsernameValidation] = useSetting('UTF8_Names_Validation');
	const [, setForcedLogin] = useSession('forceLogin');

	const usernameRegExp = useMemo(() => new RegExp(`^${ regexpForUsernameValidation }$`), [regexpForUsernameValidation]);
	const emailRegExp = useMemo(() => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/i, []);

	const { currentStep, steps, goToNextStep } = useSetupWizardState();

	const step = useMemo(() => steps.find(({ id }) => id === 'admin-info'), [steps]);
	const active = useMemo(() => currentStep.id === 'admin-info', [currentStep]);

	const [name, setName] = useState('');
	const [isNameValid, validateName] = useState(true);
	const [username, setUsername] = useState('');
	const [isUsernameValid, validateUsername] = useState(true);
	const [email, setEmail] = useState('');
	const [isEmailValid, validateEmail] = useState(true);
	const [password, setPassword] = useState('');
	const [isPasswordValid, validatePassword] = useState(true);

	const isContinueEnabled = useMemo(
		() => name && username && email && password,
		[name, username, email, password]
	);

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

	const registerAdminUser = async () => {
		await call('registerUser', { name, username, email, pass: password });
		callbacks.run('userRegistered');

		try {
			await new Promise((resolve, reject) => {
				Meteor.loginWithPassword(email, password, (error) => {
					if (error) {
						reject(error);
						return;
					}

					resolve();
				});
			});
		} catch (error) {
			if (error.error === 'error-invalid-email') {
				toastr.success(t('We_have_sent_registration_email'));
			}

			handleError(error);
			throw error;
		}

		setForcedLogin(false);

		await call('setUsername', username);

		callbacks.run('usernameSet');
	};

	const handleContinueClick = async () => {
		const canRegisterAdminUser = validate();

		if (!canRegisterAdminUser) {
			return;
		}

		try {
			await registerAdminUser();
			goToNextStep();
		} catch (error) {
			console.error(error);
		}
	};

	return <SetupWizardStep loaded active={active}>
		<SetupWizardStep.Header number={step.number} title={t(step.i18nTitleKey)} />

		<SetupWizardStep.Content>
			<Input
				title={t('Name')}
				type='text'
				icon='user'
				placeholder={t('Type_your_name')}
				value={name}
				onChange={({ currentTarget: { value } }) => setName(value)}
				error={!isNameValid}
			/>
			<Input
				title={t('Username')}
				type='text'
				icon='at'
				placeholder={t('Type_your_username')}
				value={username}
				onChange={({ currentTarget: { value } }) => setUsername(value)}
				error={!isUsernameValid && t('Invalid_username')}
			/>
			<Input
				title={t('Organization_Email')}
				type='email'
				icon='mail'
				placeholder={t('Type_your_email')}
				value={email}
				onChange={({ currentTarget: { value } }) => setEmail(value)}
				error={!isEmailValid && t('Invalid_email')}
			/>
			<Input
				title={t('Password')}
				type='password'
				icon='key'
				placeholder={t('Type_your_password')}
				value={password}
				onChange={({ currentTarget: { value } }) => setPassword(value)}
				error={!isPasswordValid}
			/>
		</SetupWizardStep.Content>

		<SetupWizardStep.Footer>
			<Button primary disabled={!isContinueEnabled} onClick={handleContinueClick}>
				{t('Continue')}
			</Button>
		</SetupWizardStep.Footer>
	</SetupWizardStep>;
}
