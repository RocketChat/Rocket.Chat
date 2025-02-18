import type { IUser } from '@rocket.chat/core-typings';
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldError,
	FieldHint,
	TextInput,
	TextAreaInput,
	Box,
	Icon,
	Button,
} from '@rocket.chat/fuselage';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import {
	useAccountsCustomFields,
	useToastMessageDispatch,
	useTranslation,
	useEndpoint,
	useUser,
	useMethod,
} from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { AllHTMLAttributes, ReactElement } from 'react';
import { useId, useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import type { AccountProfileFormValues } from './getProfileInitialValues';
import { useAccountProfileSettings } from './useAccountProfileSettings';
import { validateEmail } from '../../../../lib/emailValidator';
import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import UserStatusMenu from '../../../components/UserStatusMenu';
import UserAvatarEditor from '../../../components/avatar/UserAvatarEditor';
import { useUpdateAvatar } from '../../../hooks/useUpdateAvatar';
import { USER_STATUS_TEXT_MAX_LENGTH, BIO_TEXT_MAX_LENGTH } from '../../../lib/constants';

const AccountProfileForm = (props: AllHTMLAttributes<HTMLFormElement>): ReactElement => {
	const t = useTranslation();
	const user = useUser();
	const dispatchToastMessage = useToastMessageDispatch();

	const checkUsernameAvailability = useEndpoint('GET', '/v1/users.checkUsernameAvailability');
	const sendConfirmationEmail = useEndpoint('POST', '/v1/users.sendConfirmationEmail');

	const customFieldsMetadata = useAccountsCustomFields();

	const {
		allowRealNameChange,
		allowUserStatusMessageChange,
		allowEmailChange,
		allowUserAvatarChange,
		canChangeUsername,
		requireName,
		namesRegex,
	} = useAccountProfileSettings();

	const {
		control,
		watch,
		handleSubmit,
		reset,
		formState: { errors },
	} = useFormContext<AccountProfileFormValues>();

	const { email, avatar, username, name: userFullName } = watch();

	const previousEmail = user ? getUserEmailAddress(user) : '';
	const previousUsername = user?.username || '';
	const isUserVerified = user?.emails?.[0]?.verified ?? false;

	const mutateConfirmationEmail = useMutation({
		mutationFn: sendConfirmationEmail,
		onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Verification_email_sent') }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const handleSendConfirmationEmail = useCallback(async () => {
		if (email !== previousEmail) {
			return;
		}

		mutateConfirmationEmail.mutateAsync({ email });
	}, [email, previousEmail, mutateConfirmationEmail]);

	const validateUsername = async (username: string): Promise<string | undefined> => {
		if (!username) {
			return;
		}

		if (username === previousUsername) {
			return;
		}

		if (!namesRegex.test(username)) {
			return t('error-invalid-username');
		}

		const { result: isAvailable } = await checkUsernameAvailability({ username });
		if (!isAvailable) {
			return t('Username_already_exist');
		}
	};

	// FIXME: replace to endpoint
	const updateOwnBasicInfo = useMethod('saveUserProfile');

	const updateAvatar = useUpdateAvatar(avatar, user?._id || '');

	const handleSave = async ({ email, name, username, statusType, statusText, nickname, bio, customFields }: AccountProfileFormValues) => {
		try {
			await updateOwnBasicInfo(
				{
					realname: name,
					...(user ? getUserEmailAddress(user) !== email && { email } : {}),
					username,
					statusText,
					statusType,
					nickname,
					bio,
				},
				customFields,
			);

			await updateAvatar();
			dispatchToastMessage({ type: 'success', message: t('Profile_saved_successfully') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			reset({ email, name, username, statusType, statusText, nickname, bio, customFields });
		}
	};

	const nameId = useId();
	const usernameId = useId();
	const nicknameId = useId();
	const statusTextId = useId();
	const bioId = useId();
	const emailId = useId();

	return (
		<Box {...props} is='form' autoComplete='off' onSubmit={handleSubmit(handleSave)}>
			<FieldGroup>
				<Field>
					<Controller
						control={control}
						name='avatar'
						render={({ field: { onChange } }) => (
							<UserAvatarEditor
								etag={user?.avatarETag}
								currentUsername={user?.username}
								name={userFullName}
								username={username}
								setAvatarObj={onChange}
								disabled={!allowUserAvatarChange}
							/>
						)}
					/>
				</Field>
				<Box display='flex' flexDirection='row' justifyContent='space-between'>
					<Field mie={8} flexShrink={1}>
						<FieldLabel required htmlFor={nameId}>
							{t('Name')}
						</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='name'
								rules={{
									required: requireName && t('Required_field', { field: t('Name') }),
								}}
								render={({ field }) => (
									<TextInput
										{...field}
										id={nameId}
										error={errors.name?.message}
										disabled={!allowRealNameChange}
										aria-required='true'
										aria-invalid={errors.username ? 'true' : 'false'}
										aria-describedby={`${nameId}-error ${nameId}-hint`}
									/>
								)}
							/>
						</FieldRow>
						{errors.name && (
							<FieldError aria-live='assertive' id={`${nameId}-error`}>
								{errors.name.message}
							</FieldError>
						)}
						{!allowRealNameChange && <FieldHint id={`${nameId}-hint`}>{t('RealName_Change_Disabled')}</FieldHint>}
					</Field>
					<Field mis={8} flexShrink={1}>
						<FieldLabel required htmlFor={usernameId}>
							{t('Username')}
						</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='username'
								rules={{
									required: t('Required_field', { field: t('Username') }),
									validate: (username) => validateUsername(username),
								}}
								render={({ field }) => (
									<TextInput
										{...field}
										id={usernameId}
										disabled={!canChangeUsername}
										error={errors.username?.message}
										addon={<Icon name='at' size='x20' />}
										aria-required='true'
										aria-invalid={errors.username ? 'true' : 'false'}
										aria-describedby={`${usernameId}-error ${usernameId}-hint`}
									/>
								)}
							/>
						</FieldRow>
						{errors?.username && (
							<FieldError aria-live='assertive' id={`${usernameId}-error`}>
								{errors.username.message}
							</FieldError>
						)}
						{!canChangeUsername && <FieldHint id={`${usernameId}-hint`}>{t('Username_Change_Disabled')}</FieldHint>}
					</Field>
				</Box>
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
									disabled={!allowUserStatusMessageChange}
									flexGrow={1}
									placeholder={t('StatusMessage_Placeholder')}
									aria-invalid={errors.statusText ? 'true' : 'false'}
									aria-describedby={`${statusTextId}-error ${statusTextId}-hint`}
									addon={
										<Controller
											control={control}
											name='statusType'
											render={({ field: { value, onChange } }) => (
												<UserStatusMenu margin='neg-x2' onChange={onChange} initialStatus={value as IUser['status']} />
											)}
										/>
									}
								/>
							)}
						/>
					</FieldRow>
					{errors?.statusText && (
						<FieldError aria-live='assertive' id={`${statusTextId}-error`}>
							{errors?.statusText.message}
						</FieldError>
					)}
					{!allowUserStatusMessageChange && <FieldHint id={`${statusTextId}-hint`}>{t('StatusMessage_Change_Disabled')}</FieldHint>}
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
									error={errors.bio?.message}
									rows={3}
									flexGrow={1}
									addon={<Icon name='edit' size='x20' alignSelf='center' />}
									aria-invalid={errors.statusText ? 'true' : 'false'}
									aria-describedby={`${bioId}-error`}
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
					<FieldLabel required htmlFor={emailId}>
						{t('Email')}
					</FieldLabel>
					<FieldRow display='flex' flexDirection='row' justifyContent='space-between'>
						<Controller
							control={control}
							name='email'
							rules={{
								required: t('Required_field', { field: t('Email') }),
								validate: { validateEmail: (email) => (validateEmail(email) ? undefined : t('error-invalid-email-address')) },
							}}
							render={({ field }) => (
								<TextInput
									{...field}
									id={emailId}
									flexGrow={1}
									error={errors.email?.message}
									addon={<Icon name={isUserVerified ? 'circle-check' : 'mail'} size='x20' />}
									disabled={!allowEmailChange}
									aria-required='true'
									aria-invalid={errors.email ? 'true' : 'false'}
									aria-describedby={`${emailId}-error ${emailId}-hint`}
								/>
							)}
						/>
						{!isUserVerified && (
							<Button disabled={email !== previousEmail} onClick={handleSendConfirmationEmail} mis={24}>
								{t('Resend_verification_email')}
							</Button>
						)}
					</FieldRow>
					{errors.email && (
						<FieldError aria-live='assertive' id={`${emailId}-error`}>
							{errors?.email?.message}
						</FieldError>
					)}
					{!allowEmailChange && <FieldHint id={`${emailId}-hint`}>{t('Email_Change_Disabled')}</FieldHint>}
				</Field>
				{customFieldsMetadata && <CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />}
			</FieldGroup>
		</Box>
	);
};

export default AccountProfileForm;
