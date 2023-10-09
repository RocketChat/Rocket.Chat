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
import type { UserCreateParamsPOST } from '@rocket.chat/rest-typings';
import { CustomFieldsForm, PasswordVerifier } from '@rocket.chat/ui-client';
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
import AdminUserSetRandomPassword from './AdminUserSetRandomPassword';
import { useSmtpQuery } from './hooks/useSmtpQuery';

type AdminUserFormProps = {
	userData?: Serialized<IUser>;
	onReload: () => void;
};

export type userFormProps = Omit<
	UserCreateParamsPOST & { setPasswordManually: boolean; avatar: AvatarObject; passwordConfirmation: string },
	'fields'
>;

const getInitialValue = ({
	data,
	defaultUserRoles,
	isSmtpEnabled,
}: {
	data?: Serialized<IUser>;
	defaultUserRoles?: IUser['roles'];
	isSmtpEnabled?: boolean;
}): userFormProps => ({
	roles: data?.roles ?? defaultUserRoles,
	name: data?.name ?? '',
	password: '',
	username: data?.username ?? '',
	bio: data?.bio ?? '',
	nickname: data?.nickname ?? '',
	email: (data?.emails?.length && data.emails[0].address) || '',
	verified: (data?.emails?.length && data.emails[0].verified) || false,
	setRandomPassword: true,
	setPasswordManually: false,
	requirePasswordChange: data?.requirePasswordChange || false,
	customFields: data?.customFields ?? {},
	statusText: data?.statusText ?? '',
	joinDefaultChannels: true,
	sendWelcomeEmail: isSmtpEnabled,
	avatar: '' as AvatarObject,
	passwordConfirmation: '',
});

const UserForm = ({ userData, onReload, ...props }: AdminUserFormProps) => {
	const t = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	const customFieldsMetadata = useAccountsCustomFields();
	const defaultRoles = useSetting<string>('Accounts_Registration_Users_Default_Roles') || '';
	const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation');
	const passwordPlaceholder = String(useSetting('Accounts_PasswordPlaceholder'));
	const passwordConfirmationPlaceholder = String(useSetting('Accounts_ConfirmPasswordPlaceholder'));

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
		// reset,
		formState: { errors, isDirty },
		setValue,
	} = useForm({
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

	const handleSaveUser = useMutableCallback(async (userFormPayload: userFormProps) => {
		const { avatar, setPasswordManually, passwordConfirmation, ...userFormData } = userFormPayload;
		if (userData?._id) {
			return handleUpdateUser.mutateAsync({ userId: userData?._id, data: userFormData });
		}
		return handleCreateUser.mutateAsync({ ...userFormData, fields: '' });
	});

	const nameId = useUniqueId();
	const usernameId = useUniqueId();
	const emailId = useUniqueId();
	const verifiedId = useUniqueId();
	const statusTextId = useUniqueId();
	const bioId = useUniqueId();
	const nicknameId = useUniqueId();
	const passwordId = useUniqueId();
	const passwordConfirmationId = useUniqueId();
	const requirePasswordChangeId = useUniqueId();
	const rolesId = useUniqueId();
	const joinDefaultChannelsId = useUniqueId();
	const sendWelcomeEmailId = useUniqueId();
	const setRandomPasswordId = useUniqueId();
	const passwordVerifierId = useUniqueId();

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
					<Field color='hint'>{t('Manually_created_users_briefing')}</Field>
					<Field>
						<Field.Label htmlFor={emailId}>{t('Email')}</Field.Label>
						<Field.Row>
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
						</Field.Row>
						{errors?.email && (
							<Field.Error aria-live='assertive' id={`${emailId}-error`} fontScale='c1' mbs={12}>
								{errors.email.message}
							</Field.Error>
						)}
						<Field.Row mbs={12}>
							<Field.Label htmlFor={verifiedId} p={0}>
								{t('Mark_email_as_verified')}
							</Field.Label>
							<Controller
								control={control}
								name='verified'
								render={({ field: { onChange, value } }) => <ToggleSwitch id={verifiedId} checked={value} onChange={onChange} />}
							/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label htmlFor={nameId}>{t('Name')}</Field.Label>
						<Field.Row>
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
						</Field.Row>
						{errors?.name && (
							<Field.Error aria-live='assertive' id={`${nameId}-error`}>
								{errors.name.message}
							</Field.Error>
						)}
					</Field>
					<Field>
						<Field.Label htmlFor={usernameId}>{t('Username')}</Field.Label>
						<Field.Row>
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
						</Field.Row>
						{errors?.username && (
							<Field.Error aria-live='assertive' id={`${usernameId}-error`}>
								{errors.username.message}
							</Field.Error>
						)}
					</Field>
					<Field>
						<Field.Label htmlFor={passwordId} mbe={8}>
							{t('Password')}
						</Field.Label>
						<AdminUserSetRandomPassword
							setRandomPasswordId={setRandomPasswordId}
							control={control}
							isSmtpEnabled={isSmtpEnabled || false}
							setRandomPassword={setRandomPassword || false}
							setValue={setValue}
						/>
						{!isSmtpEnabled && (
							<Field.Hint
								id={`${setRandomPasswordId}-hint`}
								dangerouslySetInnerHTML={{ __html: t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' }) }}
							/>
						)}
						{!setRandomPassword && (
							<>
								<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexGrow={1} mbe={8}>
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
								<Field.Row>
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
												addon={<Icon name='eye-off' size='x20' />}
												placeholder={passwordPlaceholder || t('Password')}
											/>
										)}
									/>
								</Field.Row>
								{errors?.password && (
									<Field.Error aria-live='assertive' id={`${passwordId}-error`}>
										{errors.password.message}
									</Field.Error>
								)}
								{requiresPasswordConfirmation && (
									<Field.Row>
										<Controller
											control={control}
											name='passwordConfirmation'
											rules={{
												required: !userData?._id && t('The_field_is_required', t('Confirm_password')),
												deps: ['password'],
												validate: (val: string) => (watch('password') === val ? true : t('Invalid_confirm_pass')),
											}}
											render={({ field }) => (
												<PasswordInput
													{...field}
													id={passwordConfirmationId}
													aria-invalid={errors.passwordConfirmation ? 'true' : 'false'}
													aria-describedby={`${passwordConfirmationId}-error`}
													error={errors.passwordConfirmation?.message}
													flexGrow={1}
													addon={<Icon name='eye-off' size='x20' />}
													placeholder={passwordConfirmationPlaceholder || t('Confirm_password')}
												/>
											)}
										/>
									</Field.Row>
								)}
								{errors?.passwordConfirmation && (
									<Field.Error aria-live='assertive' id={`${passwordConfirmationId}-error`}>
										{errors.passwordConfirmation.message}
									</Field.Error>
								)}
								<PasswordVerifier password={password} id={passwordVerifierId} vertical />
							</>
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
											placeholder={t('Select_role')}
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
										<ToggleSwitch
											id={sendWelcomeEmailId}
											aria-describedby={`${sendWelcomeEmailId}-hint`}
											onChange={onChange}
											checked={value}
											disabled={!isSmtpEnabled}
										/>
									)}
								/>
							</Field.Row>
						</Box>
						{!isSmtpEnabled && (
							<Field.Hint
								id={`${sendWelcomeEmailId}-hint`}
								dangerouslySetInnerHTML={{ __html: t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' }) }}
							/>
						)}
					</Field>
					<Field>
						<Field.Label htmlFor={statusTextId}>{t('StatusMessage')}</Field.Label>
						<Field.Row>
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
									/>
								)}
							/>
						</Field.Row>
						{errors?.statusText && (
							<Field.Error aria-live='assertive' id={`${statusTextId}-error`}>
								{errors.statusText.message}
							</Field.Error>
						)}
					</Field>
					<Field>
						<Field.Label htmlFor={bioId}>{t('Bio')}</Field.Label>
						<Field.Row>
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
									/>
								)}
							/>
						</Field.Row>
						{errors?.bio && (
							<Field.Error aria-live='assertive' id={`${bioId}-error`}>
								{errors.bio.message}
							</Field.Error>
						)}
					</Field>
					<Field>
						<Field.Label htmlFor={nicknameId}>{t('Nickname')}</Field.Label>
						<Field.Row>
							<Controller control={control} name='nickname' render={({ field }) => <TextInput {...field} id={nicknameId} flexGrow={1} />} />
						</Field.Row>
					</Field>
				</FieldGroup>
				<FieldGroup>
					{Boolean(customFieldsMetadata.length) && (
						<>
							<Button fontScale='c2' w='x140' h='x28' display='flex' alignItems='center' justifyContent='center'>
								{t('Hide_additional_fields')}
							</Button>
							<CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />
						</>
					)}
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{/* <Button
						type='reset'
						disabled={!isDirty}
						onClick={() => reset(getInitialValue({ data: userData, defaultUserRoles, isSmtpEnabled }))}
					>
						{t('Reset')}
					</Button> */}
					<Button primary disabled={!isDirty} onClick={handleSubmit(handleSaveUser)}>
						{t('Add_user')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default UserForm;
