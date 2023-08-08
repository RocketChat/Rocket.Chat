import type { AvatarObject, IUser, Serialized } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
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
	ContextualbarFooter,
	ButtonGroup,
	Button,
} from '@rocket.chat/fuselage';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import { useTranslation, useAccountsCustomFields, useSetting } from '@rocket.chat/ui-contexts';
import type { UseMutationResult } from '@tanstack/react-query';
import React from 'react';
import type { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';

import { parseCSV } from '../../../../lib/utils/parseCSV';
import { ContextualbarScrollableContent } from '../../../components/Contextualbar';
import UserAvatarEditor from '../../../components/avatar/UserAvatarEditor';
import { useSmtpConfig } from './hooks/useSmtpConfig';

type UserFormProps = {
	availableRoles?: SelectOption[];
	// prepend?: (currentUsername: any, username: any, avatarETag: any) => React.JSX.Element;
	// hasAvatarObject: boolean;
	onSave: UseMutationResult<any, unknown, any, unknown>;
	preserveData: boolean;
	userData?: Serialized<IUser> | Record<string, never>;
	setAvatarObj?: React.Dispatch<React.SetStateAction<AvatarObject | undefined>>;
};

const isErrorString = (errorMessage: string | FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined): errorMessage is string => {
	return typeof errorMessage === 'string';
};

const UserForm = ({ availableRoles, onSave, preserveData, userData, setAvatarObj, ...props }: UserFormProps) => {
	const t = useTranslation();

	const customFieldsMetadata = useAccountsCustomFields();

	const defaultUserRoles = parseCSV(String(useSetting('Accounts_Registration_Users_Default_Roles')));
	const isSmtpEnabled = useSmtpConfig();

	const getInitialValue = (data: Serialized<IUser> | Record<string, never>) => ({
		roles: data.roles,
		name: data.name ?? '',
		password: '',
		username: data.username,
		bio: data.bio ?? '',
		nickname: data.nickname ?? '',
		email: (data.emails?.length && data.emails[0].address) || '',
		verified: (data.emails?.length && data.emails[0].verified) || false,
		setRandomPassword: false,
		requirePasswordChange: data.requirePasswordChange || false,
		customFields: data.customFields ?? {},
		statusText: data.statusText ?? '',
		joinDefaultChannels: true,
		sendWelcomeEmail: true,
		avatar: {},
	});

	const {
		control,
		watch,
		handleSubmit,
		register,
		reset,
		formState: { errors, isDirty },
	} = useForm({
		defaultValues: preserveData
			? getInitialValue(userData || {})
			: {
					name: '',
					username: '',
					email: '',
					verified: false,
					statusText: '',
					bio: '',
					nickname: '',
					password: '',
					setRandomPassword: false,
					requirePasswordChange: false,
					roles: defaultUserRoles,
					customFields: {},
					joinDefaultChannels: true,
					sendWelcomeEmail: Boolean(isSmtpEnabled),
					avatar: {},
			  },
		mode: 'all',
	});

	const { ref } = register('avatar');

	return (
		<>
			<ContextualbarScrollableContent {...props} autoComplete='off'>
				<FieldGroup>
					{userData ? (
						<UserAvatarEditor
							currentUsername={userData?.username || ''}
							username={watch('username') || ''}
							etag={userData?.avatarETag || ''}
							setAvatarObj={setAvatarObj}
						/>
					) : null}
					<Field>
						<Field.Label>{t('Name')}</Field.Label>
						<Field.Row>
							<TextInput
								error={isErrorString(errors?.name?.message) ? errors?.name?.message : ''}
								flexGrow={1}
								{...register?.('name', { required: t('The_field_is_required', t('name')) })}
							/>
						</Field.Row>
						{errors?.name && <Field.Error>{errors.name.message}</Field.Error>}
					</Field>

					<Field>
						<Field.Label>{t('Username')}</Field.Label>
						<Field.Row>
							<TextInput
								error={isErrorString(errors?.username?.message) ? errors?.username?.message : ''}
								flexGrow={1}
								addon={<Icon name='at' size='x20' />}
								{...register?.('username', { required: t('The_field_is_required', t('username')) })}
							/>
						</Field.Row>
						{errors?.username && <Field.Error>{errors.username.message}</Field.Error>}
					</Field>

					<Field>
						<Field.Label>{t('Email')}</Field.Label>
						<Field.Row>
							<TextInput
								error={isErrorString(errors?.email?.message) ? errors?.email?.message : ''}
								flexGrow={1}
								addon={<Icon name='mail' size='x20' />}
								{...register?.('email', { required: t('The_field_is_required', t('email')) })}
							/>
						</Field.Row>
						{errors?.email && <Field.Error>{errors.email.message}</Field.Error>}
						<Field.Row>
							<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' mbs={4}>
								<Box color='default' fontScale='p2m'>
									{t('Verified')}
								</Box>
								<Controller
									control={control}
									name='verified'
									render={({ field: { onChange, value } }) => <ToggleSwitch checked={value} onChange={onChange} />}
								/>
							</Box>
						</Field.Row>
					</Field>

					<Field>
						<Field.Label>{t('StatusMessage')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} addon={<Icon name='edit' size='x20' />} {...register?.('statusText')} />
						</Field.Row>
					</Field>

					<Field>
						<Field.Label>{t('Bio')}</Field.Label>
						<Field.Row>
							<TextAreaInput rows={3} flexGrow={1} addon={<Icon name='edit' size='x20' alignSelf='center' />} {...register?.('bio')} />
						</Field.Row>
					</Field>

					<Field>
						<Field.Label>{t('Nickname')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} addon={<Icon name='edit' size='x20' alignSelf='center' />} {...register?.('nickname')} />
						</Field.Row>
					</Field>
				</FieldGroup>

				<FieldGroup is='form' autoComplete='off'>
					{!watch?.('setRandomPassword') && (
						<Field>
							<Field.Label>{t('Password')}</Field.Label>
							<Field.Row>
								<PasswordInput
									{...register?.('password', { required: t('The_field_is_required', t('Password')) })}
									error={errors?.password?.message}
									flexGrow={1}
									addon={<Icon name='key' size='x20' />}
									autoComplete='new-password'
								/>
							</Field.Row>
							{errors?.password && <Field.Error>{errors.password.message}</Field.Error>}
						</Field>
					)}

					<Field>
						<Field.Row>
							<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
								<Box color='default' fontScale='p2m'>
									{t('Require_password_change')}
								</Box>
								<Controller
									control={control}
									name='requirePasswordChange'
									render={({ field: { onChange, value } }) => (
										<ToggleSwitch
											disabled={watch?.('setRandomPassword')}
											checked={watch?.('setRandomPassword') || value}
											onChange={onChange}
										/>
									)}
								/>
							</Box>
						</Field.Row>
					</Field>

					<Field>
						<Field.Row>
							<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
								<Box color='default' fontScale='p2m'>
									{t('Set_random_password_and_send_by_email')}
								</Box>
								<Controller
									control={control}
									name='setRandomPassword'
									// rules={{ required: t('The_field_is_required', t('password')) }}
									render={({ field: { onChange, value } }) => (
										<ToggleSwitch checked={value} onChange={onChange} disabled={!isSmtpEnabled} />
									)}
								/>
							</Box>
						</Field.Row>
						{!isSmtpEnabled && (
							<Field.Hint dangerouslySetInnerHTML={{ __html: t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' }) }} />
						)}
					</Field>

					<Field>
						<Field.Label>{t('Roles')}</Field.Label>
						<Field.Row>
							<Controller
								control={control}
								name='roles'
								rules={{ required: t('The_field_is_required', t('roles')) }}
								render={({ field: { onChange, value } }) => (
									<MultiSelectFiltered
										value={value}
										onChange={onChange}
										flexGrow={1}
										placeholder={t('Select_an_option')}
										options={availableRoles || []}
									/>
								)}
							/>
						</Field.Row>
						{errors?.roles && <Field.Error>{errors.roles.message}</Field.Error>}
					</Field>

					<Field>
						<Field.Row>
							<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
								<Box color='default' fontScale='p2m'>
									{t('Join_default_channels')}
								</Box>
								<Controller
									control={control}
									name='joinDefaultChannels'
									render={({ field: { onChange, value } }) => <ToggleSwitch onChange={onChange} checked={value} />}
								/>
							</Box>
						</Field.Row>
					</Field>

					<Field>
						<Field.Row>
							<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
								<Box color='default' fontScale='p2m'>
									{t('Send_welcome_email')}
								</Box>
								<Controller
									control={control}
									name='sendWelcomeEmail'
									render={({ field: { onChange, value } }) => (
										<ToggleSwitch onChange={onChange} checked={value} disabled={!isSmtpEnabled} />
									)}
								/>
							</Box>
						</Field.Row>
						{!isSmtpEnabled && (
							<Field.Hint dangerouslySetInnerHTML={{ __html: t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' }) }} />
						)}
					</Field>

					{customFieldsMetadata && (
						<>
							<Divider />
							<Box fontScale='h4'>{t('Custom_Fields')}</Box>
							<CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />
						</>
					)}
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button type='reset' disabled={!isDirty} onClick={() => reset(preserveData ? getInitialValue(userData || {}) : {})}>
						{t('Reset')}
					</Button>
					<Button
						primary
						disabled={!isDirty}
						onClick={handleSubmit(async (userFormData) => {
							onSave.mutate(preserveData ? { userId: userData?._id, data: userFormData } : userFormData);
						})}
					>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default UserForm;
