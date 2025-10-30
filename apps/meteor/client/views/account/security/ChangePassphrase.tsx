import { Box, PasswordInput, Field, FieldGroup, FieldLabel, FieldRow, FieldError, FieldHint, Button } from '@rocket.chat/fuselage';
import { PasswordVerifierList } from '@rocket.chat/ui-client';
import DOMPurify from 'dompurify';
import { useId, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { usePasswordPolicy } from './usePasswordPolicy';
import { e2e } from '../../../lib/e2ee/rocketchat.e2e';
import { useChangeE2EPasswordMutation } from '../../hooks/useChangeE2EPasswordMutation';
import { useE2EEState } from '../../room/hooks/useE2EEState';

const PASSWORD_POLICY = Object.freeze({
	enabled: true,
	minLength: 30,
	mustContainAtLeastOneLowercase: true,
	mustContainAtLeastOneUppercase: true,
	mustContainAtLeastOneNumber: true,
	mustContainAtLeastOneSpecialCharacter: true,
	forbidRepeatingCharacters: false,
});

export const ChangePassphrase = (): JSX.Element => {
	const { t } = useTranslation();
	const verify = usePasswordPolicy(PASSWORD_POLICY);
	const changeE2EEPasswordMutation = useChangeE2EPasswordMutation();

	const {
		handleSubmit,
		watch,
		resetField,
		formState: { errors, isValid },
		control,
	} = useForm({
		defaultValues: {
			password: '',
			passwordConfirm: '',
		},
	});

	const { password } = watch();

	useEffect(() => {
		resetField('passwordConfirm');
	}, [password, resetField]);

	const e2eeState = useE2EEState();
	const keysExist = e2eeState === 'READY' || e2eeState === 'SAVE_PASSWORD';
	const hasTypedPassword = password.trim().length > 0;

	const e2ePasswordExplanationId = useId();
	const passwordId = useId();
	const passwordConfirmId = useId();
	const passphraseVerifierId = useId();

	const { valid, validations } = verify(password);

	return (
		<>
			<Box
				is='p'
				fontScale='p1'
				id={e2ePasswordExplanationId}
				dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('E2E_Encryption_Password_Explanation')) }}
			/>
			<Box mbs={36} w='full'>
				<Box is='h4' fontScale='h4' mbe={12}>
					{t('Change_E2EE_password')}
				</Box>
				<FieldGroup w='full'>
					<Field>
						<FieldLabel htmlFor={passwordId}>{t('New_E2EE_password')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='password'
								rules={{
									required: t('Required_field', { field: t('New_E2EE_password') }),
									validate: (value: string) => {
										const { valid } = verify(value);
										return valid || t('Password_does_not_meet_requirements');
									},
								}}
								render={({ field }) => (
									<PasswordInput
										{...field}
										id={passwordId}
										error={errors.password?.message}
										disabled={!keysExist}
										autoComplete='new-password'
										aria-describedby={`${e2ePasswordExplanationId} ${passwordId}-hint ${passwordId}-error`}
										aria-invalid={errors.password ? 'true' : 'false'}
									/>
								)}
							/>
						</FieldRow>
						{keysExist && <PasswordVerifierList id={passphraseVerifierId} validations={validations} />}
						{!keysExist && (
							<FieldHint id={`${passwordId}-hint`}>
								<Trans i18nKey='Enter_current_E2EE_password_to_set_new'>
									To set a new password, first
									<Box
										is='a'
										href='#'
										onClick={async (e) => {
											e.preventDefault();
											await e2e.decodePrivateKeyFlow();
										}}
									>
										enter your current E2EE password.
									</Box>
								</Trans>
							</FieldHint>
						)}
						{errors?.password && (
							<FieldError role='alert' id={`${passwordId}-error`}>
								{errors.password.message}
							</FieldError>
						)}
					</Field>
					{hasTypedPassword && valid && (
						<Field>
							<FieldLabel htmlFor={passwordConfirmId}>{t('Confirm_new_E2EE_password')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='passwordConfirm'
									rules={{
										required: t('Required_field', { field: t('Confirm_new_E2EE_password') }),
										validate: (value: string) => (password !== value ? t('Passwords_do_not_match') : true),
									}}
									render={({ field }) => (
										<PasswordInput
											{...field}
											id={passwordConfirmId}
											error={errors.passwordConfirm?.message}
											aria-describedby={`${passwordConfirmId}-error`}
											aria-invalid={errors.passwordConfirm ? 'true' : 'false'}
										/>
									)}
								/>
							</FieldRow>
							{errors.passwordConfirm && (
								<FieldError role='alert' id={`${passwordConfirmId}-error`}>
									{errors.passwordConfirm.message}
								</FieldError>
							)}
						</Field>
					)}
				</FieldGroup>
				<Button
					primary
					disabled={!(keysExist && isValid && valid)}
					onClick={handleSubmit(({ password }) => {
						changeE2EEPasswordMutation.mutate(password, { onSuccess: () => resetField('password') });
					})}
					mbs={12}
					data-qa-type='e2e-encryption-save-password-button'
				>
					{t('Save_changes')}
				</Button>
			</Box>
		</>
	);
};
