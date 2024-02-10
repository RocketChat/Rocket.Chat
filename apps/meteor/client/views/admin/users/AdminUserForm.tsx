import type { AvatarObject, IUser, Serialized } from '@rocket.chat/core-typings';
import {
	Field,
	FieldLabel,
	FieldRow,
	FieldError,
	FieldHint,
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
	Callout,
} from '@rocket.chat/fuselage';
import type { SelectOption } from '@rocket.chat/fuselage';
import { useUniqueId, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import {
	useAccountsCustomFields,
	useSetting,
	useEndpoint,
	useRouter,
	useToastMessageDispatch,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import { useQuery, useMutation } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { validateEmail } from '../../../../lib/emailValidator';
import { parseCSV } from '../../../../lib/utils/parseCSV';
import { ContextualbarScrollableContent } from '../../../components/Contextualbar';
import UserAvatarEditor from '../../../components/avatar/UserAvatarEditor';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useUpdateAvatar } from '../../../hooks/useUpdateAvatar';
import { USER_STATUS_TEXT_MAX_LENGTH, BIO_TEXT_MAX_LENGTH } from '../../../lib/constants';
import { useSmtpQuery } from './hooks/useSmtpQuery';

type AdminUserFormProps = {
	userData?: Serialized<IUser>;
	onReload: () => void;
};

const getInitialValue = ({
	data,
	defaultUserRoles,
	isSmtpEnabled,
}: {
	data?: Serialized<IUser>;
	defaultUserRoles?: IUser['roles'];
	isSmtpEnabled?: boolean;
}) => ({
	roles: data?.roles ?? defaultUserRoles,
	name: data?.name ?? '',
	password: '',
	username: data?.username ?? '',
	bio: data?.bio ?? '',
	nickname: data?.nickname ?? '',
	email: (data?.emails?.length && data.emails[0].address) || '',
	verified: (data?.emails?.length && data.emails[0].verified) || false,
	setRandomPassword: false,
	requirePasswordChange: data?.requirePasswordChange || false,
	customFields: data?.customFields ?? {},
	statusText: data?.statusText ?? '',
	joinDefaultChannels: true,
	sendWelcomeEmail: isSmtpEnabled,
	avatar: '' as AvatarObject,
});

const UserForm = ({ userData, onReload, ...props }: AdminUserFormProps) => {
	const t = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	const customFieldsMetadata = useAccountsCustomFields();
	const defaultRoles = useSetting<string>('Accounts_Registration_Users_Default_Roles') || '';

	const defaultUserRoles = parseCSV(defaultRoles);
	const { data } = useSmtpQuery();
	const isSmtpEnabled = data?.isSMTPConfigured;

	const eventStats = useEndpointAction('POST', '/v1/statistics.telemetry');
	const updateUserAction = useEndpoint('POST', '/v1/users.update');
	const createUserAction = useEndpoint('POST', '/v1/users.create');

	const getRoles = useEndpoint('GET', '/v1/roles.list');
	const { data: roleData, error: roleError } = useQuery(['roles'], async () => getRoles());

	const availableRoles: SelectOption[] = roleData?.roles.map(({ _id, name, description }) => [_id, description || name]) || [];

	const goToUser = useCallback((id) => router.navigate(`/admin/users/info/${id}`), [router]);

	const {
		control,
		watch,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm({
		defaultValues: getInitialValue({ data: userData, defaultUserRoles, isSmtpEnabled }),
		mode: 'onBlur',
	});

	const { avatar, username, setRandomPassword } = watch();

	const updateAvatar = useUpdateAvatar(avatar, userData?._id || '');

	const handleUpdateUser = useMutation({
		mutationFn: updateUserAction,
		onSuccess: async ({ user: { _id } }) => {
			dispatchToastMessage({ type: 'success', message: t('User_updated_successfully') });
			await updateAvatar();
			router.navigate(`/admin/users/info/${_id}`);
			onReload();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleCreateUser = useMutation({
		mutationFn: createUserAction,
		onSuccess: async (data) => {
			dispatchToastMessage({ type: 'success', message: t('User_created_successfully!') });
			await eventStats({
				params: [{ eventName: 'updateCounter', settingsId: 'Manual_Entry_User_Count' }],
			});
			goToUser(data.user._id);
			onReload();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleSaveUser = useMutableCallback(async (userFormPayload) => {
		const { avatar, ...userFormData } = userFormPayload;
		if (userData?._id) {
			return handleUpdateUser.mutateAsync({ userId: userData?._id, data: userFormData });
		}
		return handleCreateUser.mutateAsync(userFormData);
	});

	const nameId = useUniqueId();
	const usernameId = useUniqueId();
	const emailId = useUniqueId();
	const verifiedId = useUniqueId();
	const statusTextId = useUniqueId();
	const bioId = useUniqueId();
	const nicknameId = useUniqueId();
	const passwordId = useUniqueId();
	const requirePasswordChangeId = useUniqueId();
	const setRandomPasswordId = useUniqueId();
	const rolesId = useUniqueId();
	const joinDefaultChannelsId = useUniqueId();
	const sendWelcomeEmailId = useUniqueId();
	return (
		<>
			<ContextualbarScrollableContent {...props}>
				<FieldGroup>
					{userData?._id && (
						<Field>
							<Controller
								name='avatar'
								control={control}
								render={({ field: { onChange } }) => (
									<UserAvatarEditor
										currentUsername={userData?.username}
										username={username}
										etag={userData?.avatarETag}
										setAvatarObj={onChange}
									/>
								)}
							/>
						</Field>
					)}
					<Field>
						<FieldLabel htmlFor={nameId}>{t('Name')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='name'
								rules={{ required: t('The_field_is_required', t('Name')) }}
								render={({ field }) => (
									<TextInput
										{...field}
										id={nameId}
										aria-invalid={errors.name ? 'true' : 'false'}
										aria-describedby={`${nameId}-error`}
										error={errors.name?.message}
										flexGrow={1}
									/>
								)}
							/>
						</FieldRow>
						{errors?.name && (
							<FieldError aria-live='assertive' id={`${nameId}-error`}>
								{errors.name.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor={usernameId}>{t('Username')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='username'
								rules={{
									required: t('The_field_is_required', t('Username')),
									validate: (value) => usernamePattern.test(value) || t('Invalid_username'),
								}}
								render={({ field }) => (
									<TextInput
										{...field}
										id={usernameId}
										aria-invalid={errors.username ? 'true' : 'false'}
										aria-describedby={`${usernameId}-error`}
										error={errors.username?.message}
										flexGrow={1}
										addon={<Icon name='at' size='x20' />}
									/>
								)}
							/>
						</FieldRow>
						{errors?.username && (
							<FieldError aria-live='assertive' id={`${usernameId}-error`}>
								{errors.username.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor={emailId}>{t('Email')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='email'
								rules={{
									required: t('The_field_is_required', t('Email')),
									validate: {
										validUsername: value => {
											const minLength = 3;
											const maxLength = 16;
											const allowedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
											
											// Check if the length is within the allowed range
											if (value.length < minLength || value.length > maxLength) {
												return t('Invalid_username');
											}
							
											// Check if each character is within the allowed characters
											for (let i = 0; i < value.length; i++) {
												if (!allowedChars.includes(value[i])) {
													return t('Invalid_username');
												}
											}
							
											return true;
										}
									}
								}}
								render={({ field }) => (
									<TextInput
										{...field}
										id={emailId}
										aria-invalid={errors.email ? 'true' : 'false'}
										aria-describedby={`${emailId}-error`}
										error={errors.email?.message}
										flexGrow={1}
										addon={<Icon name='mail' size='x20' />}
									/>
								)}
							/>
						</FieldRow>
						{errors?.email && (
							<FieldError aria-live='assertive' id={`${emailId}-error`}>
								{errors.email.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={verifiedId}>{t('Verified')}</FieldLabel>
							<Controller
								control={control}
								name='verified'
								render={({ field: { onChange, value } }) => <ToggleSwitch id={verifiedId} checked={value} onChange={onChange} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={statusTextId}>{t('StatusMessage')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='statusText'
								rules={{ maxLength: { value: USER_STATUS_TEXT_MAX_LENGTH, message: t('Max_length_is', USER_STATUS_TEXT_MAX_LENGTH) } }}
								render={({ field }) => (
									<TextInput
										{...field}
										id={statusTextId}
										error={errors?.statusText?.message}
										aria-invalid={errors.statusText ? 'true' : 'false'}
										aria-describedby={`${statusTextId}-error`}
										flexGrow={1}
										addon={<Icon name='edit' size='x20' />}
									/>
								)}
							/>
						</FieldRow>
						{errors?.statusText && (
							<FieldError aria-live='assertive' id={`${statusTextId}-error`}>
								{errors.statusText.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor={bioId}>{t('Bio')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='bio'
								rules={{ maxLength: { value: BIO_TEXT_MAX_LENGTH, message: t('Max_length_is', BIO_TEXT_MAX_LENGTH) } }}
								render={({ field }) => (
									<TextAreaInput
										{...field}
										id={bioId}
										rows={3}
										error={errors?.bio?.message}
										aria-invalid={errors.bio ? 'true' : 'false'}
										aria-describedby={`${bioId}-error`}
										flexGrow={1}
										addon={<Icon name='edit' size='x20' alignSelf='center' />}
									/>
								)}
							/>
						</FieldRow>
						{errors?.bio && (
							<FieldError aria-live='assertive' id={`${bioId}-error`}>
								{errors.bio.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor={nicknameId}>{t('Nickname')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='nickname'
								render={({ field }) => (
									<TextInput {...field} id={nicknameId} flexGrow={1} addon={<Icon name='edit' size='x20' alignSelf='center' />} />
								)}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
				<FieldGroup>
					{!setRandomPassword && (
						<Field>
							<FieldLabel htmlFor={passwordId}>{t('Password')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='password'
									rules={{ required: !userData?._id && t('The_field_is_required', t('Password')) }}
									render={({ field }) => (
										<PasswordInput
											{...field}
											id={passwordId}
											aria-invalid={errors.password ? 'true' : 'false'}
											aria-describedby={`${passwordId}-error`}
											error={errors.password?.message}
											flexGrow={1}
											addon={<Icon name='key' size='x20' />}
										/>
									)}
								/>
							</FieldRow>
							{errors?.password && (
								<FieldError aria-live='assertive' id={`${passwordId}-error`}>
									{errors.password.message}
								</FieldError>
							)}
						</Field>
					)}
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={requirePasswordChangeId}>{t('Require_password_change')}</FieldLabel>
							<Controller
								control={control}
								name='requirePasswordChange'
								render={({ field: { ref, onChange, value } }) => (
									<ToggleSwitch
										ref={ref}
										id={requirePasswordChangeId}
										disabled={setRandomPassword}
										checked={setRandomPassword || value}
										onChange={onChange}
									/>
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={setRandomPasswordId}>{t('Set_random_password_and_send_by_email')}</FieldLabel>
							<Controller
								control={control}
								name='setRandomPassword'
								render={({ field: { ref, onChange, value } }) => (
									<ToggleSwitch
										ref={ref}
										id={setRandomPasswordId}
										aria-describedby={`${setRandomPasswordId}-hint`}
										checked={value}
										onChange={onChange}
										disabled={!isSmtpEnabled}
									/>
								)}
							/>
						</FieldRow>
						{!isSmtpEnabled && (
							<FieldHint
								id={`${setRandomPasswordId}-hint`}
								dangerouslySetInnerHTML={{ __html: t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' }) }}
							/>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor={rolesId}>{t('Roles')}</FieldLabel>
						<FieldRow>
							{roleError && <Callout>{roleError}</Callout>}
							{!roleError && (
								<Controller
									control={control}
									name='roles'
									rules={{ required: t('The_field_is_required', t('Roles')) }}
									render={({ field: { onChange, value } }) => (
										<MultiSelectFiltered
											id={rolesId}
											value={value}
											onChange={onChange}
											flexGrow={1}
											placeholder={t('Select_an_option')}
											options={availableRoles}
										/>
									)}
								/>
							)}
						</FieldRow>
						{errors?.roles && <FieldError>{errors.roles.message}</FieldError>}
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={joinDefaultChannelsId}>{t('Join_default_channels')}</FieldLabel>
							<Controller
								control={control}
								name='joinDefaultChannels'
								render={({ field: { ref, onChange, value } }) => (
									<ToggleSwitch id={joinDefaultChannelsId} ref={ref} onChange={onChange} checked={value} />
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={sendWelcomeEmailId}>{t('Send_welcome_email')}</FieldLabel>
							<Controller
								control={control}
								name='sendWelcomeEmail'
								render={({ field: { onChange, value } }) => (
									<ToggleSwitch
										id={sendWelcomeEmailId}
										aria-describedby={`${sendWelcomeEmailId}-hint`}
										onChange={onChange}
										checked={value}
										disabled={!isSmtpEnabled}
									/>
								)}
							/>
						</FieldRow>
						{!isSmtpEnabled && (
							<FieldHint
								id={`${sendWelcomeEmailId}-hint`}
								dangerouslySetInnerHTML={{ __html: t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' }) }}
							/>
						)}
					</Field>
					{Boolean(customFieldsMetadata.length) && (
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
					<Button
						type='reset'
						disabled={!isDirty}
						onClick={() => reset(getInitialValue({ data: userData, defaultUserRoles, isSmtpEnabled }))}
					>
						{t('Reset')}
					</Button>
					<Button primary disabled={!isDirty} onClick={handleSubmit(handleSaveUser)}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default UserForm;
