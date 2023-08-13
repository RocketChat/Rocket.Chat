import {
	Field,
	TextInput,
	TextAreaInput,
	PasswordInput,
	MultiSelectFiltered,
	Box,
	ToggleSwitch,
	Icon,
	Divider,
	FieldGroup,
} from '@rocket.chat/fuselage';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import { useTranslation, useAccountsCustomFields } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { validateEmail } from '../../../../lib/emailValidator';
import { ContextualbarScrollableContent } from '../../../components/Contextualbar';

export default function UserForm({ formValues, formHandlers, availableRoles, append, prepend, errors, isSmtpEnabled, ...props }) {
	const t = useTranslation();

	const {
		name,
		username,
		email,
		verified,
		statusText,
		bio,
		nickname,
		password,
		setRandomPassword,
		requirePasswordChange,
		roles,
		customFields,
		joinDefaultChannels,
		sendWelcomeEmail,
	} = formValues;

	const {
		handleName,
		handleUsername,
		handleEmail,
		handleVerified,
		handleStatusText,
		handleBio,
		handleNickname,
		handlePassword,
		handleSetRandomPassword,
		handleRequirePasswordChange,
		handleRoles,
		handleCustomFields,
		handleJoinDefaultChannels,
		handleSendWelcomeEmail,
	} = formHandlers;

	const customFieldsMetadata = useAccountsCustomFields();

	const { control, watch } = useForm({
		defaultValues: { customFields: { ...customFields } },
		mode: 'onBlur',
	});

	useEffect(() => {
		const subscription = watch((value) => handleCustomFields({ ...value.customFields }));
		return () => subscription.unsubscribe();
	}, [watch, handleCustomFields]);

	return (
		<>
			<ContextualbarScrollableContent {...props} is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} autoComplete='off'>
				<FieldGroup>
					{prepend}
					{useMemo(
						() => (
							<Field>
								<Field.Label>{t('Name')}</Field.Label>
								<Field.Row>
									<TextInput error={errors && errors.name} flexGrow={1} value={name} onChange={handleName} />
								</Field.Row>
								{errors && errors.name && <Field.Error>{errors.name}</Field.Error>}
							</Field>
						),
						[t, name, handleName, errors],
					)}
					{useMemo(
						() => (
							<Field>
								<Field.Label>{t('Username')}</Field.Label>
								<Field.Row>
									<TextInput
										error={errors && errors.username}
										flexGrow={1}
										value={username}
										onChange={handleUsername}
										addon={<Icon name='at' size='x20' />}
									/>
								</Field.Row>
								{errors && errors.username && <Field.Error>{errors.username}</Field.Error>}
							</Field>
						),
						[t, username, handleUsername, errors],
					)}
					{useMemo(
						() => (
							<Field>
								<Field.Label>{t('Email')}</Field.Label>
								<Field.Row>
									<TextInput
										error={errors && errors.email}
										flexGrow={1}
										value={email}
										error={!validateEmail(email) && email.length > 0 ? 'error' : undefined}
										onChange={handleEmail}
										addon={<Icon name='mail' size='x20' />}
									/>
								</Field.Row>
								{errors && errors.email && <Field.Error>{errors.email}</Field.Error>}
								<Field.Row>
									<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' mbs={4}>
										<Box color='default' fontScale='p2m'>
											{t('Verified')}
										</Box>
										<ToggleSwitch checked={verified} onChange={handleVerified} />
									</Box>
								</Field.Row>
							</Field>
						),
						[t, email, handleEmail, verified, handleVerified, errors],
					)}
					{useMemo(
						() => (
							<Field>
								<Field.Label>{t('StatusMessage')}</Field.Label>
								<Field.Row>
									<TextInput flexGrow={1} value={statusText} onChange={handleStatusText} addon={<Icon name='edit' size='x20' />} />
								</Field.Row>
							</Field>
						),
						[t, statusText, handleStatusText],
					)}
					{useMemo(
						() => (
							<Field>
								<Field.Label>{t('Bio')}</Field.Label>
								<Field.Row>
									<TextAreaInput
										rows={3}
										flexGrow={1}
										value={bio}
										onChange={handleBio}
										addon={<Icon name='edit' size='x20' alignSelf='center' />}
									/>
								</Field.Row>
							</Field>
						),
						[bio, handleBio, t],
					)}
					{useMemo(
						() => (
							<Field>
								<Field.Label>{t('Nickname')}</Field.Label>
								<Field.Row>
									<TextInput
										flexGrow={1}
										value={nickname}
										onChange={handleNickname}
										addon={<Icon name='edit' size='x20' alignSelf='center' />}
									/>
								</Field.Row>
							</Field>
						),
						[nickname, handleNickname, t],
					)}
				</FieldGroup>

				<FieldGroup is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} autoComplete='off'>
					{useMemo(
						() =>
							!setRandomPassword && (
								<Field>
									<Field.Label>{t('Password')}</Field.Label>
									<Field.Row>
										<PasswordInput
											errors={errors && errors.password}
											flexGrow={1}
											value={password}
											onChange={handlePassword}
											addon={<Icon name='key' size='x20' />}
											autoComplete='new-password'
										/>
									</Field.Row>
									{errors && errors.password && <Field.Error>{errors.password}</Field.Error>}
								</Field>
							),
						[t, password, handlePassword, errors, setRandomPassword],
					)}
					{useMemo(
						() => (
							<Field>
								<Field.Row>
									<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
										<Box color='default' fontScale='p2m'>
											{t('Require_password_change')}
										</Box>
										<ToggleSwitch
											disabled={setRandomPassword}
											checked={setRandomPassword || requirePasswordChange}
											onChange={handleRequirePasswordChange}
										/>
									</Box>
								</Field.Row>
							</Field>
						),
						[t, setRandomPassword, requirePasswordChange, handleRequirePasswordChange],
					)}
					{useMemo(
						() => (
							<Field>
								<Field.Row>
									<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
										<Box color='default' fontScale='p2m'>
											{t('Set_random_password_and_send_by_email')}
										</Box>
										<ToggleSwitch checked={setRandomPassword} disabled={!isSmtpEnabled} onChange={handleSetRandomPassword} />
									</Box>
								</Field.Row>
								{!isSmtpEnabled && (
									<Field.Hint dangerouslySetInnerHTML={{ __html: t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' }) }} />
								)}
							</Field>
						),
						[t, setRandomPassword, handleSetRandomPassword, isSmtpEnabled],
					)}
					{useMemo(
						() => (
							<Field>
								<Field.Label>{t('Roles')}</Field.Label>
								<Field.Row>
									<MultiSelectFiltered
										options={availableRoles}
										value={roles}
										onChange={handleRoles}
										placeholder={t('Select_role')}
										flexShrink={1}
									/>
								</Field.Row>
							</Field>
						),
						[availableRoles, handleRoles, roles, t],
					)}
					{useMemo(
						() =>
							handleJoinDefaultChannels && (
								<Field>
									<Field.Row>
										<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
											<Box color='default' fontScale='p2m'>
												{t('Join_default_channels')}
											</Box>
											<ToggleSwitch checked={joinDefaultChannels} onChange={handleJoinDefaultChannels} />
										</Box>
									</Field.Row>
								</Field>
							),
						[handleJoinDefaultChannels, t, joinDefaultChannels],
					)}
					{useMemo(
						() =>
							handleSendWelcomeEmail && (
								<Field>
									<Field.Row>
										<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
											<Box color='default' fontScale='p2m'>
												{t('Send_welcome_email')}
											</Box>
											<ToggleSwitch checked={sendWelcomeEmail} onChange={handleSendWelcomeEmail} disabled={!isSmtpEnabled} />
										</Box>
									</Field.Row>
									{!isSmtpEnabled && (
										<Field.Hint dangerouslySetInnerHTML={{ __html: t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' }) }} />
									)}
								</Field>
							),
						[handleSendWelcomeEmail, t, sendWelcomeEmail, isSmtpEnabled],
					)}
					{useMemo(
						() =>
							customFieldsMetadata && (
								<>
									<Divider />
									<Box fontScale='h4'>{t('Custom_Fields')}</Box>
									<CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />
								</>
							),
						[customFieldsMetadata, control, t],
					)}
				</FieldGroup>
			</ContextualbarScrollableContent>
			{append}
		</>
	);
}
