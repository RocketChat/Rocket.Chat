import { Box, Margins, PasswordInput, Field, FieldGroup, Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod, useTranslation, useLogout } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React, { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { e2e } from '../../../../app/e2e/client/rocketchat.e2e';

const EndToEnd = (props: ComponentProps<typeof Box>): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const logout = useLogout();

	const publicKey = localStorage.getItem('public_key');
	const privateKey = localStorage.getItem('private_key');

	const resetE2eKey = useMethod('e2e.resetOwnE2EKey');

	const {
		register,
		handleSubmit,
		watch,
		resetField,
		formState: { errors, isValid },
	} = useForm({
		defaultValues: {
			password: '',
			passwordConfirm: '',
		},
		mode: 'onChange',
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

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' mbs={16} {...props}>
			<Margins blockEnd={8}>
				<Box fontScale='h4'>{t('E2E_Encryption_Password_Change')}</Box>
				<Box dangerouslySetInnerHTML={{ __html: t('E2E_Encryption_Password_Explanation') }} />
				<FieldGroup w='full'>
					<Field>
						<Field.Label id='New_encryption_password'>{t('New_encryption_password')}</Field.Label>
						<Field.Row>
							<PasswordInput
								{...register('password', { required: true })}
								placeholder={t('New_Password_Placeholder')}
								disabled={!keysExist}
								aria-labelledby='New_encryption_password'
							/>
						</Field.Row>
						{!keysExist && <Field.Hint>{t('EncryptionKey_Change_Disabled')}</Field.Hint>}
					</Field>
					{hasTypedPassword && (
						<Field>
							<Field.Label id='Confirm_new_encryption_password'>{t('Confirm_new_encryption_password')}</Field.Label>
							<PasswordInput
								error={errors.passwordConfirm?.message}
								{...register('passwordConfirm', {
									required: true,
									validate: (value: string) => (password !== value ? 'Your passwords do no match' : true),
								})}
								placeholder={t('Confirm_New_Password_Placeholder')}
								aria-labelledby='Confirm_new_encryption_password'
							/>
							{errors.passwordConfirm && <Field.Error>{errors.passwordConfirm.message}</Field.Error>}
						</Field>
					)}
				</FieldGroup>
				<Button
					primary
					disabled={!(keysExist && isValid)}
					onClick={handleSubmit(saveNewPassword)}
					data-qa-type='e2e-encryption-save-password-button'
				>
					{t('Save_changes')}
				</Button>
				<Box fontScale='h4' mbs={16}>
					{t('Reset_E2E_Key')}
				</Box>
				<Box dangerouslySetInnerHTML={{ __html: t('E2E_Reset_Key_Explanation') }} />
				<Button onClick={handleResetE2eKey} data-qa-type='e2e-encryption-reset-key-button'>
					{t('Reset_E2E_Key')}
				</Button>
			</Margins>
		</Box>
	);
};

export default EndToEnd;
