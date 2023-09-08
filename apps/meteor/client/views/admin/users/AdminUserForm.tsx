import type { AvatarObject, IUser, Serialized } from '@rocket.chat/core-typings';
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

const getInitialValue = (data?: Serialized<IUser>, defaultUserRoles?: IUser['roles']) => ({
	roles: data?.roles ?? defaultUserRoles,
	name: data?.name ?? '',
	password: '',
	username: data?.username,
	bio: data?.bio ?? '',
	nickname: data?.nickname ?? '',
	email: (data?.emails?.length && data.emails[0].address) || '',
	verified: (data?.emails?.length && data.emails[0].verified) || false,
	setRandomPassword: false,
	requirePasswordChange: data?.requirePasswordChange || false,
	customFields: data?.customFields ?? {},
	statusText: data?.statusText ?? '',
	joinDefaultChannels: true,
	sendWelcomeEmail: true,
	avatar: '' as AvatarObject,
});

// TODO: check email is already in use in UI
// TODO: add validation to statusText
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
		register,
		reset,
		formState: { errors, isDirty },
	} = useForm({
		defaultValues: getInitialValue(userData, defaultUserRoles),
		mode: 'all',
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
						<Field.Label htmlFor={nameId}>{t('Name')}</Field.Label>
						<Field.Row>
							<TextInput
								id={nameId}
								aria-invalid={errors.name ? 'true' : 'false'}
								error={errors.name?.message}
								flexGrow={1}
								{...register('name', { required: t('The_field_is_required', t('Name')) })}
							/>
						</Field.Row>
						{errors?.name && <Field.Error>{errors.name.message}</Field.Error>}
					</Field>
					<Field>
						<Field.Label htmlFor={usernameId}>{t('Username')}</Field.Label>
						<Field.Row>
							<TextInput
								id={usernameId}
								aria-invalid={errors.username ? 'true' : 'false'}
								error={errors.username?.message}
								flexGrow={1}
								addon={<Icon name='at' size='x20' />}
								{...register('username', { required: t('The_field_is_required', t('Username')) })}
							/>
						</Field.Row>
						{errors?.username && <Field.Error>{errors.username.message}</Field.Error>}
					</Field>
					<Field>
						<Field.Label htmlFor={emailId}>{t('Email')}</Field.Label>
						<Field.Row>
							<TextInput
								id={emailId}
								aria-invalid={errors.email ? 'true' : 'false'}
								error={errors.email?.message}
								flexGrow={1}
								addon={<Icon name='mail' size='x20' />}
								{...register('email', { required: t('The_field_is_required', t('Email')) })}
							/>
						</Field.Row>
						{errors?.email && <Field.Error>{errors.email.message}</Field.Error>}
					</Field>
					<Field>
						<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexGrow={1}>
							<Field.Label htmlFor={verifiedId}>{t('Verified')}</Field.Label>
							<Field.Row>
								<Controller
									control={control}
									name='verified'
									render={({ field: { onChange, value } }) => <ToggleSwitch id={verifiedId} checked={value} onChange={onChange} />}
								/>
							</Field.Row>
						</Box>
					</Field>
					<Field>
						<Field.Label htmlFor={statusTextId}>{t('StatusMessage')}</Field.Label>
						<Field.Row>
							<TextInput
								id={statusTextId}
								{...register('statusText', {
									maxLength: { value: USER_STATUS_TEXT_MAX_LENGTH, message: t('Max_length_is', USER_STATUS_TEXT_MAX_LENGTH) },
								})}
								flexGrow={1}
								addon={<Icon name='edit' size='x20' />}
							/>
						</Field.Row>
						{errors?.statusText && <Field.Error>{errors.statusText.message}</Field.Error>}
					</Field>
					<Field>
						<Field.Label htmlFor={bioId}>{t('Bio')}</Field.Label>
						<Field.Row>
							<TextAreaInput
								id={bioId}
								{...register('bio', { maxLength: { value: BIO_TEXT_MAX_LENGTH, message: t('Max_length_is', BIO_TEXT_MAX_LENGTH) } })}
								rows={3}
								flexGrow={1}
								addon={<Icon name='edit' size='x20' alignSelf='center' />}
							/>
						</Field.Row>
						{errors?.bio && <Field.Error>{errors.bio.message}</Field.Error>}
					</Field>
					<Field>
						<Field.Label htmlFor={nicknameId}>{t('Nickname')}</Field.Label>
						<Field.Row>
							<TextInput
								id={nicknameId}
								{...register('nickname')}
								flexGrow={1}
								addon={<Icon name='edit' size='x20' alignSelf='center' />}
							/>
						</Field.Row>
					</Field>
				</FieldGroup>
				<FieldGroup>
					{!setRandomPassword && (
						<Field>
							<Field.Label htmlFor={passwordId}>{t('Password')}</Field.Label>
							<Field.Row>
								<PasswordInput
									id={passwordId}
									{...register('password', { required: !userData?._id && t('The_field_is_required', t('Password')) })}
									aria-invalid={errors.password ? 'true' : 'false'}
									error={errors.password?.message}
									flexGrow={1}
									addon={<Icon name='key' size='x20' />}
								/>
							</Field.Row>
							{errors?.password && <Field.Error>{errors.password.message}</Field.Error>}
						</Field>
					)}
					<Field>
						<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexGrow={1}>
							<Field.Label htmlFor={requirePasswordChangeId}>{t('Require_password_change')}</Field.Label>
							<Field.Row>
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
							</Field.Row>
						</Box>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexGrow={1}>
							<Field.Label htmlFor={setRandomPasswordId}>{t('Set_random_password_and_send_by_email')}</Field.Label>
							<Field.Row>
								<Controller
									control={control}
									name='setRandomPassword'
									render={({ field: { ref, onChange, value } }) => (
										<ToggleSwitch ref={ref} id={setRandomPasswordId} checked={value} onChange={onChange} disabled={!isSmtpEnabled} />
									)}
								/>
							</Field.Row>
						</Box>
						{!isSmtpEnabled && (
							<Field.Hint dangerouslySetInnerHTML={{ __html: t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' }) }} />
						)}
					</Field>
					<Field>
						<Field.Label htmlFor={rolesId}>{t('Roles')}</Field.Label>
						<Field.Row>
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
						</Field.Row>
						{errors?.roles && <Field.Error>{errors.roles.message}</Field.Error>}
					</Field>
					<Field>
						<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexGrow={1}>
							<Field.Label htmlFor={joinDefaultChannelsId}>{t('Join_default_channels')}</Field.Label>
							<Field.Row>
								<Controller
									control={control}
									name='joinDefaultChannels'
									render={({ field: { ref, onChange, value } }) => (
										<ToggleSwitch id={joinDefaultChannelsId} ref={ref} onChange={onChange} checked={value} />
									)}
								/>
							</Field.Row>
						</Box>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexGrow={1}>
							<Field.Label htmlFor={sendWelcomeEmailId}>{t('Send_welcome_email')}</Field.Label>
							<Field.Row>
								<Controller
									control={control}
									name='sendWelcomeEmail'
									render={({ field: { onChange, value } }) => (
										<ToggleSwitch id={sendWelcomeEmailId} onChange={onChange} checked={value} disabled={!isSmtpEnabled} />
									)}
								/>
							</Field.Row>
						</Box>
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
					<Button type='reset' disabled={!isDirty} onClick={() => reset(getInitialValue(userData))}>
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
