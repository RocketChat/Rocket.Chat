import type { IUser } from '@rocket.chat/core-typings';
import { Field, FieldGroup, TextInput, TextAreaInput, Box, Icon, Button } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
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
import React, { useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { validateEmail } from '../../../../lib/emailValidator';
import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import UserStatusMenu from '../../../components/UserStatusMenu';
import UserAvatarEditor from '../../../components/avatar/UserAvatarEditor';
import { useUpdateAvatar } from '../../../hooks/useUpdateAvatar';
import { USER_STATUS_TEXT_MAX_LENGTH, BIO_TEXT_MAX_LENGTH } from '../../../lib/constants';
import type { AccountProfileFormValues } from './getProfileInitialValues';
import { useAccountProfileSettings } from './useAccountProfileSettings';

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
		formState: { errors },
	} = useFormContext<AccountProfileFormValues>();

	const { email, avatar, username } = watch();

	const previousEmail = user ? getUserEmailAddress(user) : '';
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
		}
	};

	const nameId = useUniqueId();
	const usernameId = useUniqueId();
	const nicknameId = useUniqueId();
	const statusTextId = useUniqueId();
	const bioId = useUniqueId();
	const emailId = useUniqueId();

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
						<Field.Label required htmlFor={nameId}>
							{t('Name')}
						</Field.Label>
						<Field.Row>
							<Controller
								control={control}
								name='name'
								rules={{ validate: (name) => (requireName && name === '' ? t('error-the-field-is-required', { field: t('Name') }) : true) }}
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
						</Field.Row>
						{errors.name && (
							<Field.Error aria-live='assertive' id={`${nameId}-error`}>
								{errors.name.message}
							</Field.Error>
						)}
						{!allowRealNameChange && <Field.Hint id={`${nameId}-hint`}>{t('RealName_Change_Disabled')}</Field.Hint>}
					</Field>
					<Field mis={8} flexShrink={1}>
						<Field.Label required htmlFor={usernameId}>
							{t('Username')}
						</Field.Label>
						<Field.Row>
							<Controller
								control={control}
								name='username'
								rules={{
									required: t('error-the-field-is-required', { field: t('Username') }),
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
						</Field.Row>
						{errors?.username && (
							<Field.Error aria-live='assertive' id={`${usernameId}-error`}>
								{errors.username.message}
							</Field.Error>
						)}
						{!canChangeUsername && <Field.Hint id={`${usernameId}-hint`}>{t('Username_Change_Disabled')}</Field.Hint>}
					</Field>
				</Box>
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
					</Field.Row>
					{errors?.statusText && (
						<Field.Error aria-live='assertive' id={`${statusTextId}-error`}>
							{errors?.statusText.message}
						</Field.Error>
					)}
					{!allowUserStatusMessageChange && <Field.Hint id={`${statusTextId}-hint`}>{t('StatusMessage_Change_Disabled')}</Field.Hint>}
				</Field>
				<Field>
					<Field.Label htmlFor={nicknameId}>{t('Nickname')}</Field.Label>
					<Field.Row>
						<Controller
							control={control}
							name='nickname'
							render={({ field }) => (
								<TextInput {...field} id={nicknameId} flexGrow={1} addon={<Icon name='edit' size='x20' alignSelf='center' />} />
							)}
						/>
					</Field.Row>
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
									error={errors.bio?.message}
									rows={3}
									flexGrow={1}
									addon={<Icon name='edit' size='x20' alignSelf='center' />}
									aria-invalid={errors.statusText ? 'true' : 'false'}
									aria-describedby={`${bioId}-error`}
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
					<Field.Label required htmlFor={emailId}>
						{t('Email')}
					</Field.Label>
					<Field.Row display='flex' flexDirection='row' justifyContent='space-between'>
						<Controller
							control={control}
							name='email'
							rules={{ validate: { validateEmail: (email) => (validateEmail(email) ? undefined : t('error-invalid-email-address')) } }}
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
					</Field.Row>
					{errors.email && (
						<Field.Error aria-live='assertive' id={`${emailId}-error`}>
							{errors?.email?.message}
						</Field.Error>
					)}
					{!allowEmailChange && <Field.Hint id={`${emailId}-hint`}>{t('Email_Change_Disabled')}</Field.Hint>}
				</Field>
				{customFieldsMetadata && <CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />}
			</FieldGroup>
		</Box>
	);
};

export default AccountProfileForm;
