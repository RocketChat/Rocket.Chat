import { Box, Field, FieldError, FieldGroup, FieldHint, FieldLabel, FieldRow, PasswordInput } from '@rocket.chat/fuselage';
import { PasswordVerifier, useValidatePassword } from '@rocket.chat/ui-client';
import { useMethod, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import type { AllHTMLAttributes } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useAllowPasswordChange } from './useAllowPasswordChange';

type PasswordFieldValues = { password: string; confirmationPassword: string };

const ChangePassword = (props: AllHTMLAttributes<HTMLFormElement>) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const passwordId = useId();
	const confirmPasswordId = useId();
	const passwordVerifierId = useId();

	const {
		watch,
		formState: { errors },
		handleSubmit,
		reset,
		control,
	} = useFormContext<PasswordFieldValues>();

	const password = watch('password');
	const passwordIsValid = useValidatePassword(password);
	const { allowPasswordChange } = useAllowPasswordChange();

	// FIXME: replace to endpoint
	const updatePassword = useMethod('saveUserProfile');

	const handleSave = async ({ password }: { password?: string }) => {
		try {
			await updatePassword({ newPassword: password }, {});
			dispatchToastMessage({ type: 'success', message: t('Password_changed_successfully') });
			reset();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<Box {...props} is='form' autoComplete='off' onSubmit={handleSubmit(handleSave)}>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={passwordId}>{t('New_password')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='password'
							rules={{
								required: t('Required_field', { field: t('New_password') }),
								validate: () => (password?.length && !passwordIsValid ? t('Password_must_meet_the_complexity_requirements') : true),
							}}
							render={({ field }) => (
								<PasswordInput
									{...field}
									id={passwordId}
									error={errors.password?.message}
									flexGrow={1}
									disabled={!allowPasswordChange}
									aria-describedby={`${passwordVerifierId} ${passwordId}-hint ${passwordId}-error`}
									aria-invalid={errors.password ? 'true' : 'false'}
								/>
							)}
						/>
					</FieldRow>
					{!allowPasswordChange && <FieldHint id={`${passwordId}-hint`}>{t('Password_Change_Disabled')}</FieldHint>}
					{errors?.password && (
						<FieldError aria-live='assertive' id={`${passwordId}-error`}>
							{errors.password.message}
						</FieldError>
					)}
					{allowPasswordChange && <PasswordVerifier password={password} id={passwordVerifierId} />}
				</Field>
				<Field>
					<FieldLabel htmlFor={confirmPasswordId}>{t('Confirm_password')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='confirmationPassword'
							rules={{
								required: t('Required_field', { field: t('Confirm_password') }),
								validate: (confirmationPassword) => (password !== confirmationPassword ? t('Passwords_do_not_match') : true),
							}}
							render={({ field }) => (
								<PasswordInput
									{...field}
									id={confirmPasswordId}
									error={errors.confirmationPassword?.message}
									flexGrow={1}
									disabled={!allowPasswordChange || !passwordIsValid}
									aria-required={password !== '' ? 'true' : 'false'}
									aria-invalid={errors.confirmationPassword ? 'true' : 'false'}
									aria-describedby={`${confirmPasswordId}-error`}
								/>
							)}
						/>
					</FieldRow>
					{errors.confirmationPassword && (
						<FieldError aria-live='assertive' id={`${confirmPasswordId}-error`}>
							{errors.confirmationPassword.message}
						</FieldError>
					)}
				</Field>
			</FieldGroup>
		</Box>
	);
};

export default ChangePassword;
