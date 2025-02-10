import { Box, PasswordInput, Field, FieldGroup, FieldLabel, FieldRow, FieldError, FieldHint, Button, Divider } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod, useTranslation, useLogout } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import { Accounts } from 'meteor/accounts-base';
import type { ComponentProps, ReactElement } from 'react';
import { useId, useCallback, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { e2e } from '../../../../app/e2e/client/rocketchat.e2e';

const EndToEnd = (props: ComponentProps<typeof Box>): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const logout = useLogout();

	const publicKey = Accounts.storageLocation.getItem('public_key');
	const privateKey = Accounts.storageLocation.getItem('private_key');

	const resetE2eKey = useMethod('e2e.resetOwnE2EKey');

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
		mode: 'all',
	});

	const { password } = watch();

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

	const handleResetE2eKey = useCallback(async () => {
		try {
			const result = await resetE2eKey();
			if (result) {
				dispatchToastMessage({ type: 'success', message: t('User_e2e_key_was_reset') });
				logout();
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, resetE2eKey, logout, t]);

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
					{t('E2E_Encryption_Password_Change')}
				</Box>

				<FieldGroup w='full'>
					<Field>
						<FieldLabel htmlFor={passwordId}>{t('New_encryption_password')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='password'
								rules={{ required: t('Required_field', { field: t('New_encryption_password') }) }}
								render={({ field }) => (
									<PasswordInput
										{...field}
										id={passwordId}
										error={errors.password?.message}
										placeholder={t('New_Password_Placeholder')}
										disabled={!keysExist}
										aria-describedby={`${e2ePasswordExplanationId} ${passwordId}-hint ${passwordId}-error`}
										aria-invalid={errors.password ? 'true' : 'false'}
									/>
								)}
							/>
						</FieldRow>
						{!keysExist && <FieldHint id={`${passwordId}-hint`}>{t('EncryptionKey_Change_Disabled')}</FieldHint>}
						{errors?.password && (
							<FieldError aria-live='assertive' id={`${passwordId}-error`}>
								{errors.password.message}
							</FieldError>
						)}
					</Field>
					{hasTypedPassword && (
						<Field>
							<FieldLabel htmlFor={passwordConfirmId}>{t('Confirm_new_encryption_password')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='passwordConfirm'
									rules={{
										required: t('Required_field', { field: t('Confirm_new_encryption_password') }),
										validate: (value: string) => (password !== value ? 'Your passwords do no match' : true),
									}}
									render={({ field }) => (
										<PasswordInput
											{...field}
											id={passwordConfirmId}
											error={errors.passwordConfirm?.message}
											placeholder={t('Confirm_New_Password_Placeholder')}
											aria-describedby={`${passwordConfirmId}-error`}
											aria-invalid={errors.password ? 'true' : 'false'}
										/>
									)}
								/>
							</FieldRow>
							{errors.passwordConfirm && (
								<FieldError aria-live='assertive' id={`${passwordConfirmId}-error`}>
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
					{t('Reset_E2E_Key')}
				</Box>
				<Box is='p' fontScale='p1' mbe={12} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('E2E_Reset_Key_Explanation')) }} />
				<Button onClick={handleResetE2eKey} data-qa-type='e2e-encryption-reset-key-button'>
					{t('Reset_E2E_Key')}
				</Button>
			</Box>
		</Box>
	);
};

export default EndToEnd;
