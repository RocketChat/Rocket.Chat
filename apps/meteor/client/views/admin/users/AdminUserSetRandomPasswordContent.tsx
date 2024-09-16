import { Box, FieldError, FieldLabel, FieldRow, PasswordInput, ToggleSwitch } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { PasswordVerifier, useValidatePassword } from '@rocket.chat/ui-client';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { UserFormProps } from './AdminUserForm';

type AdminUserSetRandomPasswordContentProps = {
	control: Control<UserFormProps, any>;
	setRandomPassword: boolean | undefined;
	isNewUserPage: boolean;
	passwordId: string;
	errors: FieldErrors<UserFormProps>;
	password: string;
};

const AdminUserSetRandomPasswordContent = ({
	control,
	setRandomPassword,
	isNewUserPage,
	passwordId,
	errors,
	password,
}: AdminUserSetRandomPasswordContentProps) => {
	const t = useTranslation();

	const passwordConfirmationId = useUniqueId();
	const requirePasswordChangeId = useUniqueId();
	const passwordVerifierId = useUniqueId();

	const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation');
	const passwordPlaceholder = String(useSetting('Accounts_PasswordPlaceholder'));
	const passwordConfirmationPlaceholder = String(useSetting('Accounts_ConfirmPasswordPlaceholder'));

	const passwordIsValid = useValidatePassword(password);

	return (
		<>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexGrow={1} mbe={8} mbs={12}>
				<FieldLabel htmlFor={requirePasswordChangeId}>{t('Require_password_change')}</FieldLabel>
				<FieldRow>
					<Controller
						control={control}
						name='requirePasswordChange'
						render={({ field: { ref, onChange, value } }) => (
							<ToggleSwitch ref={ref} id={requirePasswordChangeId} disabled={setRandomPassword} checked={value} onChange={onChange} />
						)}
					/>
				</FieldRow>
			</Box>
			<FieldRow>
				<Controller
					control={control}
					name='password'
					rules={{
						validate: () => (password?.length && !passwordIsValid ? t('Password_must_meet_the_complexity_requirements') : true),
						required: isNewUserPage && t('Required_field', { field: t('Password') }),
					}}
					render={({ field }) => (
						<PasswordInput
							{...field}
							id={passwordId}
							aria-invalid={errors.password ? 'true' : 'false'}
							aria-describedby={`${passwordId}-error`}
							error={errors.password?.message}
							flexGrow={1}
							placeholder={passwordPlaceholder || t('Password')}
						/>
					)}
				/>
			</FieldRow>
			{errors?.password && (
				<FieldError aria-live='assertive' id={`${passwordId}-error`}>
					{errors.password.message}
				</FieldError>
			)}
			{requiresPasswordConfirmation && (
				<FieldRow>
					<Controller
						control={control}
						name='passwordConfirmation'
						rules={{
							required: isNewUserPage && t('Required_field', { field: t('Confirm_password') }),
							deps: ['password'],
							validate: (confirmationPassword) => (password !== confirmationPassword ? t('Invalid_confirm_pass') : true),
						}}
						render={({ field }) => (
							<PasswordInput
								{...field}
								id={passwordConfirmationId}
								aria-invalid={errors.passwordConfirmation ? 'true' : 'false'}
								aria-describedby={`${passwordConfirmationId}-error`}
								error={errors.passwordConfirmation?.message}
								flexGrow={1}
								placeholder={passwordConfirmationPlaceholder || t('Confirm_password')}
							/>
						)}
					/>
				</FieldRow>
			)}
			{errors?.passwordConfirmation && (
				<FieldError aria-live='assertive' id={`${passwordConfirmationId}-error`}>
					{errors.passwordConfirmation.message}
				</FieldError>
			)}
			<PasswordVerifier password={password} id={passwordVerifierId} vertical />
		</>
	);
};

export default AdminUserSetRandomPasswordContent;
