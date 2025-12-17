import { Box, Field, FieldError, FieldGroup, FieldLabel, FieldRow, TextInput, PasswordInput, Button } from '@rocket.chat/fuselage';
import { validateEmail } from '@rocket.chat/tools';
import { useSetting, useMethod, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useId } from 'react';
import { useForm, Controller } from 'react-hook-form';

type AdminInfoFormData = {
	name: string;
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
};

const AdminInfoStep = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const nameId = useId();
	const usernameId = useId();
	const emailId = useId();
	const passwordId = useId();
	const confirmPasswordId = useId();

	const regexpForUsernameValidation = useSetting('UTF8_User_Names_Validation');
	const usernameRegExp = new RegExp(`^${regexpForUsernameValidation}$`);
	const usernameBlackList = ['all', 'here', 'admin'].map((username) => new RegExp(`^${username.trim()}$`, 'i'));
	const hasBlockedName = (username: string): boolean =>
		!!usernameBlackList.length && usernameBlackList.some((restrictedUsername) => restrictedUsername.test(username.trim()));

	const registerUser = useMethod('registerUser');

	const { mutate: registerAdminUser, isPending } = useMutation({
		mutationFn: async (data: AdminInfoFormData) => {
			await registerUser({
				name: data.name,
				username: data.username,
				email: data.email,
				pass: data.password,
			});
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Admin_user_created_successfully' as any) });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const {
		control,
		handleSubmit,
		formState: { errors },
		watch,
	} = useForm<AdminInfoFormData>();

	const password = watch('password');

	const validateUsername = (username: string): boolean | string => {
		if (!usernameRegExp.test(username) || hasBlockedName(username)) {
			return t('Invalid_username');
		}
		return true;
	};

	const validateEmailField = (email: string): boolean | string => {
		if (!validateEmail(email)) {
			return t('Invalid_email');
		}
		return true;
	};

	const validatePassword = (password: string): boolean | string => {
		if (!password || password.length === 0) {
			return t('Required_field', { field: t('Password') });
		}
		return true;
	};

	const validateConfirmPassword = (confirmPassword: string): boolean | string => {
		if (confirmPassword !== password) {
			return t('Passwords_do_not_match');
		}
		return true;
	};

	const onSubmit = (data: AdminInfoFormData) => {
		registerAdminUser(data);
	};

	return (
		<Box is='form' onSubmit={handleSubmit(onSubmit)} autoComplete='off'>
			<FieldGroup>
				<Field>
					<FieldLabel required htmlFor={nameId}>
						{t('Name')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='name'
							rules={{ required: t('Required_field', { field: t('Name') }) }}
							render={({ field }) => (
								<TextInput
									{...field}
									id={nameId}
									error={errors.name?.message}
									aria-required='true'
									aria-invalid={errors.name ? 'true' : 'false'}
									aria-describedby={errors.name ? `${nameId}-error` : undefined}
								/>
							)}
						/>
					</FieldRow>
					{errors.name && (
						<FieldError aria-live='assertive' id={`${nameId}-error`}>
							{errors.name.message}
						</FieldError>
					)}
				</Field>
				<Field>
					<FieldLabel required htmlFor={usernameId}>
						{t('Username')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='username'
							rules={{
								required: t('Required_field', { field: t('Username') }),
								validate: validateUsername,
							}}
							render={({ field }) => (
								<TextInput
									{...field}
									id={usernameId}
									error={errors.username?.message}
									aria-required='true'
									aria-invalid={errors.username ? 'true' : 'false'}
									aria-describedby={errors.username ? `${usernameId}-error` : undefined}
								/>
							)}
						/>
					</FieldRow>
					{errors.username && (
						<FieldError aria-live='assertive' id={`${usernameId}-error`}>
							{errors.username.message}
						</FieldError>
					)}
				</Field>
				<Field>
					<FieldLabel required htmlFor={emailId}>
						{t('Email')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='email'
							rules={{
								required: t('Required_field', { field: t('Email') }),
								validate: validateEmailField,
							}}
							render={({ field }) => (
								<TextInput
									{...field}
									id={emailId}
									error={errors.email?.message}
									aria-required='true'
									aria-invalid={errors.email ? 'true' : 'false'}
									aria-describedby={errors.email ? `${emailId}-error` : undefined}
								/>
							)}
						/>
					</FieldRow>
					{errors.email && (
						<FieldError aria-live='assertive' id={`${emailId}-error`}>
							{errors.email.message}
						</FieldError>
					)}
				</Field>
				<Field>
					<FieldLabel required htmlFor={passwordId}>
						{t('Password')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='password'
							rules={{ validate: validatePassword }}
							render={({ field }) => (
								<PasswordInput
									{...field}
									id={passwordId}
									error={errors.password?.message}
									aria-required='true'
									aria-invalid={errors.password ? 'true' : 'false'}
									aria-describedby={errors.password ? `${passwordId}-error` : undefined}
								/>
							)}
						/>
					</FieldRow>
					{errors.password && (
						<FieldError aria-live='assertive' id={`${passwordId}-error`}>
							{errors.password.message}
						</FieldError>
					)}
				</Field>
				<Field>
					<FieldLabel required htmlFor={confirmPasswordId}>
						{t('Confirm_password')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='confirmPassword'
							rules={{ validate: validateConfirmPassword }}
							render={({ field }) => (
								<PasswordInput
									{...field}
									id={confirmPasswordId}
									error={errors.confirmPassword?.message}
									aria-required='true'
									aria-invalid={errors.confirmPassword ? 'true' : 'false'}
									aria-describedby={errors.confirmPassword ? `${confirmPasswordId}-error` : undefined}
								/>
							)}
						/>
					</FieldRow>
					{errors.confirmPassword && (
						<FieldError aria-live='assertive' id={`${confirmPasswordId}-error`}>
							{errors.confirmPassword.message}
						</FieldError>
					)}
				</Field>
				<Field>
					<FieldRow>
						<Button type='submit' primary disabled={isPending}>
							{t('Create_admin_user' as any)}
						</Button>
					</FieldRow>
				</Field>
			</FieldGroup>
		</Box>
	);
};

export default AdminInfoStep;
