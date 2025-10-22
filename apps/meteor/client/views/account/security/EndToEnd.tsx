import { Box, PasswordInput, Field, FieldGroup, FieldLabel, FieldRow, FieldError, FieldHint, Button, Divider } from '@rocket.chat/fuselage';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import { Accounts } from 'meteor/accounts-base';
import type { ComponentProps, ReactElement } from 'react';
import { useId, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { e2e } from '../../../lib/e2ee/rocketchat.e2e';
import { useResetE2EPasswordMutation } from '../../hooks/useResetE2EPasswordMutation';

const EndToEnd = (props: ComponentProps<typeof Box>): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const publicKey = Accounts.storageLocation.getItem('public_key');
	const privateKey = Accounts.storageLocation.getItem('private_key');

	const resetE2EPassword = useResetE2EPasswordMutation();

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

	/**
	 * TODO: We need to figure out a way to make this reactive,
	 * so the form will allow change password as soon the user enter the current E2EE password
	 */
	const keysExist = Boolean(publicKey && privateKey);

	const hasTypedPassword = Boolean(password?.trim().length);

	const saveNewPassword = async (data: { password: string; passwordConfirm: string }) => {
		try {
			await e2e.changePassword(data.password);
			resetField('password');
			dispatchToastMessage({ type: 'success', message: t('Encryption_key_saved_successfully') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	useEffect(() => {
		if (password?.trim() === '') {
			resetField('passwordConfirm');
		}
	}, [password, resetField]);

	const passwordId = useId();
	const e2ePasswordExplanationId = useId();
	const passwordConfirmId = useId();

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' {...props}>
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
								rules={{ required: t('Required_field', { field: t('New_E2EE_password') }) }}
								render={({ field }) => (
									<PasswordInput
										{...field}
										id={passwordId}
										error={errors.password?.message}
										disabled={!keysExist}
										aria-describedby={`${e2ePasswordExplanationId} ${passwordId}-hint ${passwordId}-error`}
										aria-invalid={errors.password ? 'true' : 'false'}
									/>
								)}
							/>
						</FieldRow>
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
					{hasTypedPassword && (
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
					disabled={!(keysExist && isValid)}
					onClick={handleSubmit(saveNewPassword)}
					mbs={12}
					data-qa-type='e2e-encryption-save-password-button'
				>
					{t('Save_changes')}
				</Button>
			</Box>
			<Divider mb={36} width='full' />
			<Box>
				<Box is='h4' fontScale='h4' mbe={12}>
					{t('Reset_E2EE_password')}
				</Box>
				<Box is='p' fontScale='p1' mbe={12}>
					{t('Reset_E2EE_password_description')}
				</Box>
				<Button onClick={() => resetE2EPassword.mutate()} data-qa-type='e2e-encryption-reset-key-button'>
					{t('Reset_E2EE_password')}
				</Button>
			</Box>
		</Box>
	);
};

export default EndToEnd;
