import { Box, EmailInput, Field, NumberInput, PasswordInput, TextAreaInput, TextInput, ToggleSwitch } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import { get, useFormContext } from 'react-hook-form';

const SmtpInfoForm = () => {
	const t = useTranslation();

	const {
		register,
		formState: { errors, isSubmitting },
	} = useFormContext();

	return (
		<Box maxWidth='x600' w='full'>
			<Box mbs='x16' mi='x4'>
				<Field>
					<Field.Label>{t('Server')}*</Field.Label>
					<TextInput {...register('server', { required: true })} disabled={isSubmitting} data-testid='server' />
					<Field.Error>{get(errors, 'server').message}</Field.Error>
				</Field>
			</Box>
			<Box mbs='x16' mi='x4'>
				<Field>
					<Field.Label>{t('Port')}*</Field.Label>
					<NumberInput {...register('port', { required: true })} disabled={isSubmitting} data-testid='port' />
					<Field.Error>{get(errors, 'port').message}</Field.Error>
				</Field>
			</Box>
			<Box mbs='x16' mi='x4'>
				<Field>
					<Field.Label>{t('Username')}*</Field.Label>
					<TextInput {...register('username', { required: true })} disabled={isSubmitting} data-testid='username' />
					<Field.Error>{get(errors, 'username').message}</Field.Error>
				</Field>
			</Box>
			<Box mbs='x16' mi='x4'>
				<Field>
					<Field.Label>{t('Password')}*</Field.Label>
					<PasswordInput {...register('password', { required: true })} disabled={isSubmitting} data-testid='password' />
					<Field.Error>{get(errors, 'password').message}</Field.Error>
				</Field>
			</Box>
			<Box mbs='x16' mi='x4'>
				<Field>
					<Field.Label>{t('Connect_SSL_TLS')}</Field.Label>
				</Field>
				<ToggleSwitch {...register('connectSsl', { required: false })} />
			</Box>
		</Box>
	);
};

export default SmtpInfoForm;
