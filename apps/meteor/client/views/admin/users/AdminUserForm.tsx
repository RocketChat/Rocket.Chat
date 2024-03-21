import type { AvatarObject, IUser, Serialized } from '@rocket.chat/core-typings';
import {
	Field,
	FieldLabel,
	FieldRow,
	FieldError,
	FieldHint,
	TextInput,
	TextAreaInput,
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
import type { UserCreateParamsPOST } from '@rocket.chat/rest-typings';
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
import AdminUserSetRandomPasswordContent from './AdminUserSetRandomPasswordContent';
import AdminUserSetRandomPasswordRadios from './AdminUserSetRandomPasswordRadios';
import { useSmtpQuery } from './hooks/useSmtpQuery';

type AdminUserFormProps = {
	userData?: Serialized<IUser>;
	onReload: () => void;
	context: string;
};

export type UserFormProps = Omit<UserCreateParamsPOST & { avatar: AvatarObject; passwordConfirmation: string }, 'fields'>;

const getInitialValue = ({
	data,
	defaultUserRoles,
	isSmtpEnabled,
	isEditingExistingUser,
}: {
	data?: Serialized<IUser>;
	defaultUserRoles?: IUser['roles'];
	isSmtpEnabled?: boolean;
	isEditingExistingUser?: boolean;
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
	...(!isEditingExistingUser && { joinDefaultChannels: true }),
	sendWelcomeEmail: isSmtpEnabled,
	avatar: '' as AvatarObject,
	passwordConfirmation: '',
});

const UserForm = ({ userData, onReload, context, ...props }: AdminUserFormProps) => {
	const t = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	const customFieldsMetadata = useAccountsCustomFields();
	const defaultRoles = useSetting<string>('Accounts_Registration_Users_Default_Roles') || '';
	const isVerificationNeeded = useSetting('Accounts_EmailVerification');

	const defaultUserRoles = parseCSV(defaultRoles);
	const { data, isSuccess: isSmtpStatusAvailable } = useSmtpQuery();
	const isSmtpEnabled = data?.isSMTPConfigured;
	const isNewUserPage = context === 'new';

	const eventStats = useEndpointAction('POST', '/v1/statistics.telemetry');
	const updateUserAction = useEndpoint('POST', '/v1/users.update');
	const createUserAction = useEndpoint('POST', '/v1/users.create');

	const getRoles = useEndpoint('GET', '/v1/roles.list');
	const { data: roleData, error: roleError } = useQuery(['roles'], async () => getRoles());

	const availableRoles: SelectOption[] = roleData?.roles.map(({ _id, name, description }) => [_id, description || name]) || [];

	const goToUser = useCallback((id) => router.navigate(`/admin/users/info/${id}`), [router]);

	const isEditingExistingUser = Boolean(userData?._id);

	const {
		control,
		watch,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
		setValue,
	} = useForm<UserFormProps>({
		defaultValues: getInitialValue({ data: userData, defaultUserRoles, isSmtpEnabled }),
		mode: 'onBlur',
	});

	const { avatar, username, setRandomPassword, password } = watch();

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
					{!isNewUserPage && (
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
					{isNewUserPage && <Box color='hint'>{t('Manually_created_users_briefing')}</Box>}
					<Field>
						<FieldLabel htmlFor={emailId}>{t('Email')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='email'
								rules={{
									required: t('The_field_is_required', t('Email')),
									validate: (email) => (validateEmail(email) ? undefined : t('ensure_email_address_valid')),
								}}
								render={({ field }) => (
									<TextInput
										{...field}
										id={emailId}
										aria-invalid={errors.email ? 'true' : 'false'}
										aria-describedby={`${emailId}-error`}
										error={errors.email?.message}
										flexGrow={1}
									/>
								)}
							/>
						</FieldRow>
						{errors?.email && (
							<FieldError aria-live='assertive' id={`${emailId}-error`} fontScale='c1' mbs={12}>
								{errors.email.message}
							</FieldError>
						)}
						<FieldRow mbs={12}>
							<Box display='flex' alignItems='center'>
								<FieldLabel htmlFor={verifiedId} p={0} disabled={!isSmtpEnabled || !isVerificationNeeded}>
									{t('Mark_email_as_verified')}
								</FieldLabel>
								<Icon name='info-circled' size='x20' mis={8} title={t('Enable_to_bypass_email_verification')} color='default' />
							</Box>
							<Controller
								control={control}
								name='verified'
								render={({ field: { onChange, value } }) => (
									<ToggleSwitch id={verifiedId} checked={value} onChange={onChange} disabled={!isSmtpEnabled || !isVerificationNeeded} />
								)}
							/>
						</FieldRow>
						{isVerificationNeeded && !isSmtpEnabled && (
							<FieldHint
								id={`${verifiedId}-hint`}
								dangerouslySetInnerHTML={{ __html: t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' }) }}
							/>
						)}
						{!isVerificationNeeded && (
							<FieldHint
								id={`${verifiedId}-hint`}
								dangerouslySetInnerHTML={{ __html: t('Email_verification_isnt_required', { url: 'admin/settings/Accounts' }) }}
							/>
						)}
					</Field>
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
								rules={{ required: t('The_field_is_required', t('Username')) }}
								render={({ field }) => (
									<TextInput
										{...field}
										id={usernameId}
										aria-invalid={errors.username ? 'true' : 'false'}
										aria-describedby={`${usernameId}-error`}
										error={errors.username?.message}
										flexGrow={1}
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
						<FieldLabel htmlFor={passwordId} mbe={8}>
							{t('Password')}
						</FieldLabel>
						<AdminUserSetRandomPasswordRadios
							isNewUserPage={isNewUserPage}
							setRandomPasswordId={setRandomPasswordId}
							control={control}
							isSmtpStatusAvailable={isSmtpStatusAvailable}
							isSmtpEnabled={isSmtpEnabled}
							setValue={setValue}
						/>
						{!setRandomPassword && (
							<AdminUserSetRandomPasswordContent
								control={control}
								setRandomPassword={setRandomPassword}
								isNewUserPage={isNewUserPage}
								passwordId={passwordId}
								errors={errors}
								password={password}
							/>
						)}
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
					{/* {!setRandomPassword && (
						<Field>
							<FieldLabel htmlFor={passwordId}>{t('Password')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='password'
									rules={{ required: !isEditingExistingUser && t('The_field_is_required', t('Password')) }}
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
					</Field> */}
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
					{!isEditingExistingUser && (
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
					)}
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
