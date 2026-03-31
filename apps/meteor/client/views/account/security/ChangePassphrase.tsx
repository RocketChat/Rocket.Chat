import { Box, Field, FieldError, FieldGroup, FieldHint, FieldLabel, FieldRow, PasswordInput, Button } from '@rocket.chat/fuselage';
import { PasswordVerifierList } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, usePasswordPolicy } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { e2e } from '../../../lib/e2ee/rocketchat.e2e';
import { useE2EEState } from '../../room/hooks/useE2EEState';

const PASSPHRASE_POLICY = Object.freeze({
	enabled: true,
	minLength: 30,
	mustContainAtLeastOneLowercase: true,
	mustContainAtLeastOneUppercase: true,
	mustContainAtLeastOneNumber: true,
	mustContainAtLeastOneSpecialCharacter: true,
	forbidRepeatingCharacters: false,
});

const useKeysExist = () => {
	const state = useE2EEState();
	return state === 'READY' || state === 'SAVE_PASSWORD';
};

const useValidatePassphrase = (passphrase: string) => {
	const validate = usePasswordPolicy(PASSPHRASE_POLICY);
	return validate(passphrase);
};

const useChangeE2EPasswordMutation = () => {
	return useMutation({
		mutationFn: async (newPassword: string) => {
			await e2e.changePassword(newPassword);
		},
	});
};

const defaultValues = {
	passphrase: '',
	confirmationPassphrase: '',
};

export const ChangePassphrase = (): JSX.Element => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const uniqueId = useId();
	const passphraseId = `passphrase-${uniqueId}`;
	const passphraseHintId = `${passphraseId}-hint`;
	const passphraseErrorId = `${passphraseId}-error`;
	const confirmPassphraseId = `confirm-passphrase-${uniqueId}`;
	const confirmPassphraseErrorId = `${confirmPassphraseId}-error`;
	const passphraseVerifierId = `verifier-${uniqueId}`;
	const e2ePasswordExplanationId = `explanation-${uniqueId}`;

	const {
		watch,
		formState: { errors, isValid },
		handleSubmit,
		reset,
		resetField,
		control,
		trigger,
	} = useForm({
		defaultValues,
		mode: 'all',
	});

	const { passphrase, confirmationPassphrase } = watch();
	const { validations, valid } = useValidatePassphrase(passphrase);
	useEffect(() => {
		if (!valid) {
			resetField('confirmationPassphrase');
			return;
		}
		if (confirmationPassphrase) {
			const validateConfirmation = async () => {
				await trigger('confirmationPassphrase');
			};
			void validateConfirmation();
		}
	}, [valid, confirmationPassphrase, resetField, trigger]);
	const keysExist = useKeysExist();

	const updatePassword = useChangeE2EPasswordMutation();

	const handleSave = async ({ passphrase }: { passphrase: string }) => {
		try {
			await updatePassword.mutateAsync(passphrase);
			dispatchToastMessage({ type: 'success', message: t('Encryption_key_saved_successfully') });
			reset();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<>
			<Box
				is='p'
				fontScale='p1'
				id={e2ePasswordExplanationId}
				dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('E2E_Encryption_Password_Explanation')) }}
			/>
			<Box mbs={36} w='full'>
				<Box is='h3' fontScale='h4' mbe={12}>
					{t('Change_E2EE_password')}
				</Box>
				<FieldGroup w='full'>
					<Field>
						<FieldLabel htmlFor={passphraseId}>{t('New_E2EE_password')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='passphrase'
								rules={{
									required: t('Required_field', { field: t('New_E2EE_password') }),
									validate: () => (valid ? true : t('Password_must_meet_the_complexity_requirements')),
								}}
								render={({ field }) => (
									<PasswordInput
										{...field}
										id={passphraseId}
										error={errors.passphrase?.message}
										disabled={!keysExist}
										aria-describedby={[
											e2ePasswordExplanationId,
											keysExist ? passphraseVerifierId : passphraseHintId,
											errors.passphrase && passphraseErrorId,
										]
											.filter(Boolean)
											.join(' ')}
										aria-invalid={errors.passphrase ? 'true' : 'false'}
									/>
								)}
							/>
						</FieldRow>
						{errors.passphrase && (
							<FieldError aria-live='assertive' id={passphraseErrorId}>
								{errors.passphrase.message}
							</FieldError>
						)}
						{keysExist ? (
							<PasswordVerifierList id={passphraseVerifierId} validations={validations} />
						) : (
							<FieldHint id={passphraseHintId}>
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
					</Field>
					{valid && (
						<Field>
							<FieldLabel htmlFor={confirmPassphraseId}>{t('Confirm_new_E2EE_password')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='confirmationPassphrase'
									rules={{
										required: t('Required_field', { field: t('Confirm_password') }),
										validate: (value) => (passphrase !== value ? t('Passwords_do_not_match') : true),
									}}
									render={({ field }) => (
										<PasswordInput
											{...field}
											id={confirmPassphraseId}
											error={errors.confirmationPassphrase?.message}
											flexGrow={1}
											disabled={!keysExist || !valid}
											aria-required={passphrase ? 'true' : 'false'}
											aria-invalid={errors.confirmationPassphrase ? 'true' : 'false'}
											aria-describedby={errors.confirmationPassphrase ? confirmPassphraseErrorId : undefined}
										/>
									)}
								/>
							</FieldRow>
							{errors.confirmationPassphrase && (
								<FieldError aria-live='assertive' id={confirmPassphraseErrorId} role='alert'>
									{errors.confirmationPassphrase.message}
								</FieldError>
							)}
						</Field>
					)}
				</FieldGroup>
				<Button primary disabled={!(keysExist && valid && isValid)} onClick={handleSubmit(handleSave)} mbs={12}>
					{t('Save_changes')}
				</Button>
			</Box>
		</>
	);
};
