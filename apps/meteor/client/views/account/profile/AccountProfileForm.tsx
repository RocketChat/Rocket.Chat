import { Field, FieldGroup, TextInput, TextAreaInput, Box, Icon, PasswordInput, Button } from '@rocket.chat/fuselage';
import { useDebouncedCallback, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { SHA256 } from '@rocket.chat/sha256';
import { CustomFieldsForm, PasswordVerifier } from '@rocket.chat/ui-client';
import {
	useAccountsCustomFields,
	useMethod,
	useToastMessageDispatch,
	useTranslation,
	useEndpoint,
	useUser,
} from '@rocket.chat/ui-contexts';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes, ReactElement } from 'react';
import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { validateEmail } from '../../../../lib/emailValidator';
import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
// import UserStatusMenu from '../../../components/UserStatusMenu';
import UserAvatarEditor from '../../../components/avatar/UserAvatarEditor';
import { useUpdateAvatar } from '../../../hooks/useUpdateAvatar';
import { USER_STATUS_TEXT_MAX_LENGTH, BIO_TEXT_MAX_LENGTH } from '../../../lib/constants';
import { useAccountProfileSettings } from './useAccountProfileSettings';
import { useAllowPasswordChange } from './useAllowPasswordChange';

const AccountProfileForm = (props: AllHTMLAttributes<HTMLFormElement>): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const user = useUser();

	const checkUsernameAvailability = useEndpoint('GET', '/v1/users.checkUsernameAvailability');
	const sendConfirmationEmail = useEndpoint('POST', '/v1/users.sendConfirmationEmail');

	const customFieldsMetadata = useAccountsCustomFields();

	const [usernameError, setUsernameError] = useState<string | undefined>();

	const {
		allowRealNameChange,
		allowUserStatusMessageChange,
		allowEmailChange,
		allowUserAvatarChange,
		allowDeleteOwnAccount,
		canChangeUsername,
		requireName,
		namesRegex,
		erasureType,
	} = useAccountProfileSettings();
	const { allowPasswordChange } = useAllowPasswordChange();

	// const { realname, email, username, password, confirmationPassword, statusText, bio, statusType, customFields, nickname } =
	// 	values as AccountFormValues;

	// const {
	// 	handleRealname,
	// 	handleEmail,
	// 	handleUsername,
	// 	handlePassword,
	// 	handleConfirmationPassword,
	// 	handleAvatar,
	// 	handleStatusText,
	// 	handleStatusType,
	// 	handleBio,
	// 	handleNickname,
	// 	handleCustomFields,
	// } = handlers;

	const {
		register,
		control,
		watch,
		handleSubmit,
		formState: { errors, dirtyFields },
	} = useFormContext();

	console.log('dirtyFields', dirtyFields);

	const { avatar, realname, email, password, statusText, confirmationPassword, username } = watch();

	const previousEmail = user ? getUserEmailAddress(user) : '';

	const handleSendConfirmationEmail = useCallback(async () => {
		if (email !== previousEmail) {
			return;
		}
		try {
			await sendConfirmationEmail({ email });
			dispatchToastMessage({ type: 'success', message: t('Verification_email_sent') });
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, email, previousEmail, sendConfirmationEmail, t]);

	// this is will decide whether form can be saved
	const passwordError = useMemo(() => {
		// if changing password in not initiated, no password error
		const passwordUpdateNotStarted = !password && !confirmationPassword;
		const passwordMatches = password && confirmationPassword && password === confirmationPassword;

		return passwordUpdateNotStarted || passwordMatches ? undefined : t('Passwords_do_not_match');
	}, [t, password, confirmationPassword]);

	// this will decide when to password mismatch on UI
	const showPasswordError = useMemo(
		() => (!password || !confirmationPassword ? false : !!passwordError),
		[passwordError, password, confirmationPassword],
	);

	const emailError = useMemo(() => (validateEmail(email) ? undefined : 'error-invalid-email-address'), [email]);
	const checkUsername = useDebouncedCallback(
		async (username: string) => {
			if (user?.username === username) {
				return setUsernameError(undefined);
			}
			if (!namesRegex.test(username)) {
				return setUsernameError(t('error-invalid-username'));
			}
			const isAvailable = await checkUsernameAvailability({ username });
			if (!isAvailable) {
				return setUsernameError(t('Username_already_exist'));
			}
			setUsernameError(undefined);
		},
		400,
		[namesRegex, t, user?.username, checkUsernameAvailability, setUsernameError],
	);

	useEffect(() => {
		checkUsername(username);
	}, [checkUsername, username]);

	// useEffect(() => {
	// 	if (!password) {
	// 		handleConfirmationPassword('');
	// 	}
	// }, [password, handleConfirmationPassword]);

	const nameError = useMemo(() => {
		if (user?.name === realname) {
			return undefined;
		}
		if (!realname && requireName) {
			return t('Field_required');
		}
	}, [realname, requireName, t, user?.name]);

	const isUserVerified = user?.emails?.[0]?.verified ?? false;

	// const canSave = !(
	// 	!!passwordError ||
	// 	!!emailError ||
	// 	!!usernameError ||
	// 	!!nameError ||
	// 	!!statusTextError ||
	// 	!!bioError ||
	// 	!customFieldsError
	// );

	// useEffect(() => {
	// 	onSaveStateChange(canSave);
	// }, [canSave, onSaveStateChange]);

	// const handleSubmit = useCallback((e) => {
	// 	e.preventDefault();
	// }, []);

	const saveFn = useMethod('saveUserProfile');

	const nameId = useUniqueId();
	const usernameId = useUniqueId();
	const nicknameId = useUniqueId();

	const updateAvatar = useUpdateAvatar(avatar, user?._id || '');

	const handleSave = ({ statusType, nickname, bio, customFields, ...data }) => {
		console.log(data);
		const save = async (typedPassword?: string): Promise<void> => {
			try {
				if (!(password === confirmationPassword)) {
					throw new Error(t('Invalid_confirm_pass'));
				}
				await saveFn(
					{
						...(allowRealNameChange ? { realname } : {}),
						...(allowEmailChange && user ? getUserEmailAddress(user) !== email && { email } : {}),
						...(allowPasswordChange ? { newPassword: password } : {}),
						...(canChangeUsername ? { username } : {}),
						...(allowUserStatusMessageChange ? { statusText } : {}),
						...(typedPassword && { typedPassword: SHA256(typedPassword) }),
						statusType,
						nickname,
						bio,
					},
					customFields,
				);
				// handlePassword('');
				// handleConfirmationPassword('');
				const avatarResult = await updateAvatar();
				// if (avatarResult) {
				// 	handleAvatar('');
				// }
				// commit();
				dispatchToastMessage({ type: 'success', message: t('Profile_saved_successfully') });
			} catch (error: unknown) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		};
		save();
	};

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
								username={username}
								setAvatarObj={onChange}
								disabled={!allowUserAvatarChange}
							/>
						)}
					/>
				</Field>
				<Box display='flex' flexDirection='row' justifyContent='space-between'>
					<Field mie={8} flexShrink={1}>
						<Field.Label htmlFor={nameId}>{t('Name')}</Field.Label>
						<Field.Row>
							<TextInput {...register('realname')} id={nameId} error={nameError} disabled={!allowRealNameChange} />
						</Field.Row>
						{!allowRealNameChange && <Field.Hint>{t('RealName_Change_Disabled')}</Field.Hint>}
						<Field.Error>{nameError}</Field.Error>
					</Field>
					<Field mis={8} flexShrink={1}>
						<Field.Label htmlFor={usernameId}>{t('Username')}</Field.Label>
						<Field.Row>
							<TextInput {...register('username')} id={usernameId} error={usernameError} addon={<Icon name='at' size='x20' />} />
						</Field.Row>
						{!canChangeUsername && <Field.Hint>{t('Username_Change_Disabled')}</Field.Hint>}
						<Field.Error>{usernameError}</Field.Error>
					</Field>
				</Box>
				<Field>
					<Field.Label>{t('StatusMessage')}</Field.Label>
					<Field.Row>
						<TextInput
							{...register('statusText', {
								maxLength: { value: USER_STATUS_TEXT_MAX_LENGTH, message: t('Max_length_is', USER_STATUS_TEXT_MAX_LENGTH) },
							})}
							error={errors?.statusText?.message}
							disabled={!allowUserStatusMessageChange}
							flexGrow={1}
							placeholder={t('StatusMessage_Placeholder')}
							// addon={<UserStatusMenu margin='neg-x2' onChange={handleStatusType} initialStatus={statusType as IUser['status']} />}
						/>
					</Field.Row>
					{!allowUserStatusMessageChange && <Field.Hint>{t('StatusMessage_Change_Disabled')}</Field.Hint>}
					{errors?.statusText && <Field.Error>{errors?.statusText.message}</Field.Error>}
				</Field>
				<Field>
					<Field.Label htmlFor={nicknameId}>{t('Nickname')}</Field.Label>
					<Field.Row>
						<TextInput {...register('nickname')} flexGrow={1} addon={<Icon name='edit' size='x20' alignSelf='center' />} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Bio')}</Field.Label>
					<Field.Row>
						<TextAreaInput
							{...register('bio', { maxLength: { value: BIO_TEXT_MAX_LENGTH, message: t('Max_length_is', BIO_TEXT_MAX_LENGTH) } })}
							error={errors.bio?.message}
							rows={3}
							flexGrow={1}
							addon={<Icon name='edit' size='x20' alignSelf='center' />}
						/>
					</Field.Row>
					{errors?.bio && <Field.Error>{errors.bio.message}</Field.Error>}
				</Field>
				<Field>
					<Field.Label>{t('Email')}</Field.Label>
					<Field.Row display='flex' flexDirection='row' justifyContent='space-between'>
						<TextInput
							{...register('email')}
							flexGrow={1}
							error={emailError}
							addon={<Icon name={isUserVerified ? 'circle-check' : 'mail'} size='x20' />}
							disabled={!allowEmailChange}
						/>
						{!isUserVerified && (
							<Button disabled={email !== previousEmail} onClick={handleSendConfirmationEmail} mis={24}>
								{t('Resend_verification_email')}
							</Button>
						)}
					</Field.Row>
					{!allowEmailChange && <Field.Hint>{t('Email_Change_Disabled')}</Field.Hint>}
					<Field.Error>{t(emailError as TranslationKey)}</Field.Error>
				</Field>
				<Field>
					<Field.Label>{t('New_password')}</Field.Label>
					<Field.Row mbe={4}>
						<PasswordInput
							{...register('password')}
							autoComplete='off'
							disabled={!allowPasswordChange}
							error={showPasswordError ? passwordError : undefined}
							flexGrow={1}
							addon={<Icon name='key' size='x20' />}
							placeholder={t('Create_a_password')}
						/>
					</Field.Row>
					<Field.Row mbs={4}>
						<PasswordInput
							{...register('confirmationPassword')}
							autoComplete='off'
							error={showPasswordError ? passwordError : undefined}
							flexGrow={1}
							addon={<Icon name='key' size='x20' />}
							placeholder={t('Confirm_password')}
							disabled={!allowPasswordChange}
						/>
					</Field.Row>
					{!allowPasswordChange && <Field.Hint>{t('Password_Change_Disabled')}</Field.Hint>}
					{passwordError && <Field.Error>{showPasswordError ? passwordError : undefined}</Field.Error>}
					{allowPasswordChange && <PasswordVerifier password={password} />}
				</Field>
				{customFieldsMetadata && <CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />}
			</FieldGroup>
		</Box>
	);
};

export default AccountProfileForm;
