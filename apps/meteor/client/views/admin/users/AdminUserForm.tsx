import type { AvatarObject, IRole, IUser, Serialized } from '@rocket.chat/core-typings';
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
	FieldGroup,
	ContextualbarFooter,
	Button,
	Callout,
	Skeleton,
} from '@rocket.chat/fuselage';
import type { SelectOption } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { useId, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import AdminUserSetRandomPasswordContent from './AdminUserSetRandomPasswordContent';
import AdminUserSetRandomPasswordRadios from './AdminUserSetRandomPasswordRadios';
import PasswordFieldSkeleton from './PasswordFieldSkeleton';
import { useSmtpQuery } from './hooks/useSmtpQuery';
import { validateEmail } from '../../../../lib/emailValidator';
import { parseCSV } from '../../../../lib/utils/parseCSV';
import { ContextualbarScrollableContent } from '../../../components/Contextualbar';
import UserAvatarEditor from '../../../components/avatar/UserAvatarEditor';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useUpdateAvatar } from '../../../hooks/useUpdateAvatar';
import { USER_STATUS_TEXT_MAX_LENGTH, BIO_TEXT_MAX_LENGTH } from '../../../lib/constants';

type AdminUserFormProps = {
	userData?: Serialized<IUser>;
	onReload: () => void;
	context: string;
	refetchUserFormData?: () => void;
	roleData: { roles: IRole[] } | undefined;
	roleError: Error | null;
};

export type UserFormProps = Omit<UserCreateParamsPOST & { avatar: AvatarObject; passwordConfirmation: string }, 'fields'>;

const getInitialValue = ({
	data,
	defaultUserRoles,
	isSmtpEnabled,
	isVerificationNeeded,
	isNewUserPage,
}: {
	data?: Serialized<IUser>;
	defaultUserRoles?: IUser['roles'];
	isSmtpEnabled?: boolean;
	isVerificationNeeded?: boolean;
	isNewUserPage?: boolean;
}): UserFormProps => ({
	roles: data?.roles ?? defaultUserRoles,
	name: data?.name ?? '',
	password: '',
	username: data?.username ?? '',
	bio: data?.bio ?? '',
	nickname: data?.nickname ?? '',
	email: (data?.emails?.length && data.emails[0].address) || '',
	verified: isSmtpEnabled && isVerificationNeeded && ((data?.emails?.length && data.emails[0].verified) || false),
	setRandomPassword: isNewUserPage && isSmtpEnabled,
	requirePasswordChange: isNewUserPage && isSmtpEnabled && (data?.requirePasswordChange ?? true),
	customFields: data?.customFields ?? {},
	statusText: data?.statusText ?? '',
	...(isNewUserPage && { joinDefaultChannels: true }),
	sendWelcomeEmail: isSmtpEnabled,
	avatar: '' as AvatarObject,
	passwordConfirmation: '',
});

const AdminUserForm = ({ userData, onReload, context, refetchUserFormData, roleData, roleError, ...props }: AdminUserFormProps) => {
	const t = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const customFieldsMetadata = useAccountsCustomFields();
	const defaultRoles = useSetting('Accounts_Registration_Users_Default_Roles', '');
	const isVerificationNeeded = useSetting('Accounts_EmailVerification');
	const defaultUserRoles = parseCSV(defaultRoles);

	const { data, isLoading: isLoadingSmtpStatus } = useSmtpQuery();
	const isSmtpEnabled = !!data?.isSMTPConfigured;
	const isNewUserPage = context === 'new';

	const {
		control,
		watch,
		handleSubmit,
		formState: { errors, isDirty },
		setValue,
	} = useForm({
		values: getInitialValue({
			data: userData,
			defaultUserRoles,
			isSmtpEnabled,
			isNewUserPage,
			isVerificationNeeded: !!isVerificationNeeded,
		}),
		mode: 'onBlur',
	});

	const { avatar, username, setRandomPassword, password, name: userFullName } = watch();

	const eventStats = useEndpointAction('POST', '/v1/statistics.telemetry');
	const updateUserAction = useEndpoint('POST', '/v1/users.update');
	const createUserAction = useEndpoint('POST', '/v1/users.create');

	const availableRoles: SelectOption[] = useMemo(
		() => roleData?.roles.map(({ _id, name, description }) => [_id, description || name]) || [],
		[roleData],
	);

	const updateAvatar = useUpdateAvatar(avatar, userData?._id || '');

	const handleUpdateUser = useMutation({
		mutationFn: updateUserAction,
		onSuccess: async ({ user: { _id } }) => {
			dispatchToastMessage({ type: 'success', message: t('User_updated_successfully') });
			await updateAvatar();
			router.navigate(`/admin/users/info/${_id}`);
			onReload();
			refetchUserFormData?.();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleCreateUser = useMutation({
		mutationFn: createUserAction,
		onSuccess: async ({ user: { _id } }) => {
			dispatchToastMessage({ type: 'success', message: t('New_user_manually_created') });
			await eventStats({
				params: [{ eventName: 'updateCounter', settingsId: 'Manual_Entry_User_Count' }],
			});
			queryClient.invalidateQueries({
				queryKey: ['pendingUsersCount'],
				refetchType: 'all',
			});
			router.navigate(`/admin/users/created/${_id}`);
			onReload();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleSaveUser = useEffectEvent(async (userFormPayload: UserFormProps) => {
		const { avatar, passwordConfirmation, ...userFormData } = userFormPayload;

		if (!isNewUserPage && userData?._id) {
			return handleUpdateUser.mutateAsync({ userId: userData?._id, data: userFormData });
		}

		return handleCreateUser.mutateAsync({ ...userFormData, fields: '' });
	});

	const nameId = useId();
	const usernameId = useId();
	const emailId = useId();
	const verifiedId = useId();
	const statusTextId = useId();
	const bioId = useId();
	const nicknameId = useId();
	const passwordId = useId();
	const rolesId = useId();
	const joinDefaultChannelsId = useId();
	const sendWelcomeEmailId = useId();
	const setRandomPasswordId = useId();

	const [showCustomFields, setShowCustomFields] = useState(true);

	if (!context) {
		return null;
	}

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
										name={userFullName}
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
									required: t('Required_field', { field: t('Email') }),
									validate: (email) => (validateEmail(email) ? undefined : t('error-invalid-email-address')),
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
							<FieldError aria-live='assertive' id={`${emailId}-error`}>
								{errors.email.message}
							</FieldError>
						)}
						{isLoadingSmtpStatus ? (
							<Skeleton w='full' h={26} />
						) : (
							<>
								<FieldRow mbs={12}>
									<Box display='flex' alignItems='center'>
										<FieldLabel htmlFor={verifiedId} p={0} disabled={!isSmtpEnabled || !isVerificationNeeded} m={0}>
											{t('Mark_email_as_verified')}
										</FieldLabel>
										<Icon name='info-circled' size='x20' mis={4} title={t('Enable_to_bypass_email_verification')} color='default' />
									</Box>
									<Controller
										control={control}
										name='verified'
										render={({ field: { onChange, value } }) => (
											<ToggleSwitch
												id={verifiedId}
												checked={value}
												onChange={onChange}
												disabled={!isSmtpEnabled || !isVerificationNeeded}
											/>
										)}
									/>
								</FieldRow>
								{isVerificationNeeded && !isSmtpEnabled && (
									<FieldHint
										id={`${verifiedId}-hint`}
										dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' })) }}
									/>
								)}
								{!isVerificationNeeded && (
									<FieldHint
										id={`${verifiedId}-hint`}
										dangerouslySetInnerHTML={{
											__html: DOMPurify.sanitize(t('Email_verification_isnt_required', { url: 'admin/settings/Accounts' })),
										}}
									/>
								)}
							</>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor={nameId}>{t('Name')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='name'
								rules={{ required: t('Required_field', { field: t('Name') }) }}
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
								rules={{ required: t('Required_field', { field: t('Username') }) }}
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
						{isLoadingSmtpStatus ? (
							<PasswordFieldSkeleton />
						) : (
							<>
								<FieldLabel htmlFor={passwordId} mbe={8}>
									{t('Password')}
								</FieldLabel>
								<AdminUserSetRandomPasswordRadios
									isNewUserPage={isNewUserPage}
									setRandomPasswordId={setRandomPasswordId}
									control={control}
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
							</>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor={rolesId}>{t('Roles')}</FieldLabel>
						<FieldRow>
							{roleError && <Callout>{roleError.message}</Callout>}
							{!roleError && (
								<Controller
									control={control}
									name='roles'
									rules={{ required: t('Required_field', { field: t('Roles') }) }}
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
						</FieldRow>
						{errors?.roles && <FieldError>{errors.roles.message}</FieldError>}
					</Field>
					{isNewUserPage && (
						<Field>
							<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexGrow={1}>
								<FieldLabel htmlFor={joinDefaultChannelsId}>{t('Join_default_channels')}</FieldLabel>
								<FieldRow>
									<Controller
										control={control}
										name='joinDefaultChannels'
										render={({ field: { ref, onChange, value } }) => (
											<ToggleSwitch id={joinDefaultChannelsId} ref={ref} onChange={onChange} checked={value} />
										)}
									/>
								</FieldRow>
							</Box>
						</Field>
					)}
					<Field>
						{isLoadingSmtpStatus ? (
							<Skeleton w='full' h={26} />
						) : (
							<>
								<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexGrow={1} mbe={8}>
									<FieldLabel htmlFor={sendWelcomeEmailId} disabled={!isSmtpEnabled}>
										{t('Send_welcome_email')}
									</FieldLabel>
									<FieldRow>
										<Controller
											control={control}
											name='sendWelcomeEmail'
											defaultValue={isSmtpEnabled}
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
								</Box>
								{!isSmtpEnabled && (
									<FieldHint
										id={`${sendWelcomeEmailId}-hint`}
										dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' })) }}
										mbs={0}
									/>
								)}
							</>
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
							<Controller control={control} name='nickname' render={({ field }) => <TextInput {...field} id={nicknameId} flexGrow={1} />} />
						</FieldRow>
					</Field>
					{!!customFieldsMetadata.length && (
						<>
							<Button
								fontScale='c2'
								w='x140'
								h='x28'
								display='flex'
								alignItems='center'
								justifyContent='center'
								onClick={() => setShowCustomFields((prevState) => !prevState)}
							>
								{showCustomFields ? t('Hide_additional_fields') : t('Show_additional_fields')}
							</Button>
							{showCustomFields && <CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />}
						</>
					)}
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<Button primary disabled={!isDirty} onClick={handleSubmit(handleSaveUser)} w='100%'>
					{isNewUserPage ? t('Add_user') : t('Save_user')}
				</Button>
			</ContextualbarFooter>
		</>
	);
};

export default AdminUserForm;
