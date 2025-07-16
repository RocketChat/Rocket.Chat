import type { IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, FieldError, FieldHint, TextInput, TextAreaInput } from '@rocket.chat/fuselage-forms';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import {
	useAccountsCustomFields,
	useToastMessageDispatch,
	useTranslation,
	useEndpoint,
	useUser,
	useMethod,
	useLayout,
} from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { AllHTMLAttributes, ReactElement } from 'react';
import { useCallback } from 'react';
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
	const { isMobile } = useLayout();

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
		if (!username) return;

		if (username === previousUsername) return;

		if (!namesRegex.test(username)) return t('error-invalid-username');

		const { result: isAvailable } = await checkUsernameAvailability({ username });
		if (!isAvailable) return t('Username_already_exist');
	};

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

				<Box
					display='flex'
					flexDirection={isMobile ? 'column' : 'row'}
					alignItems='stretch'
					justifyContent='space-between'
					className={css`
						gap: 16px;
					`}
				>
					<Field flexShrink={1}>
						<FieldLabel required>{t('Name')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='name'
								rules={{ required: requireName && t('Required_field', { field: t('Name') }) }}
								render={({ field }) => (
									<TextInput {...field} disabled={!allowRealNameChange} error={errors.name?.message} aria-required={true} />
								)}
							/>
						</FieldRow>
						{errors.name && <FieldError>{errors.name.message}</FieldError>}
						{!allowRealNameChange && <FieldHint>{t('RealName_Change_Disabled')}</FieldHint>}
					</Field>

					<Field flexShrink={1}>
						<FieldLabel required>{t('Username')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='username'
								rules={{
									required: t('Required_field', { field: t('Username') }),
									validate: validateUsername,
								}}
								render={({ field }) => (
									<TextInput
										{...field}
										aria-required={true}
										disabled={!canChangeUsername}
										addon={<Icon name='at' size='x20' />}
										error={errors.username?.message}
									/>
								)}
							/>
						</FieldRow>
						{errors.username && <FieldError>{errors.username.message}</FieldError>}
						{!canChangeUsername && <FieldHint>{t('Username_Change_Disabled')}</FieldHint>}
					</Field>
				</Box>

				<Field>
					<FieldLabel>{t('StatusMessage')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='statusText'
							rules={{
								maxLength: { value: USER_STATUS_TEXT_MAX_LENGTH, message: t('Max_length_is', USER_STATUS_TEXT_MAX_LENGTH) },
							}}
							render={({ field }) => (
								<TextInput
									{...field}
									placeholder={t('StatusMessage_Placeholder')}
									disabled={!allowUserStatusMessageChange}
									flexGrow={1}
									error={errors.statusText?.message}
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
					{errors.statusText && <FieldError>{errors.statusText.message}</FieldError>}
					{!allowUserStatusMessageChange && <FieldHint>{t('StatusMessage_Change_Disabled')}</FieldHint>}
				</Field>

				<Field>
					<FieldLabel>{t('Nickname')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='nickname'
							render={({ field }) => <TextInput {...field} flexGrow={1} addon={<Icon name='edit' size='x20' alignSelf='center' />} />}
						/>
					</FieldRow>
				</Field>

				<Field>
					<FieldLabel>{t('Bio')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='bio'
							rules={{
								maxLength: { value: BIO_TEXT_MAX_LENGTH, message: t('Max_length_is', BIO_TEXT_MAX_LENGTH) },
							}}
							render={({ field }) => (
								<TextAreaInput
									{...field}
									rows={3}
									flexGrow={1}
									error={errors.bio?.message}
									addon={<Icon name='edit' size='x20' alignSelf='center' />}
								/>
							)}
						/>
					</FieldRow>
					{errors.bio && <FieldError>{errors.bio.message}</FieldError>}
				</Field>

				<Field>
					<FieldLabel required>{t('Email')}</FieldLabel>
					<FieldRow
						display='flex'
						flexDirection={isMobile ? 'column' : 'row'}
						alignItems='stretch'
						justifyContent='space-between'
						className={css`
							gap: 8px;
						`}
					>
						<Controller
							control={control}
							name='email'
							rules={{
								required: t('Required_field', { field: t('Email') }),
								validate: {
									validateEmail: (email) => (validateEmail(email) ? undefined : t('error-invalid-email-address')),
								},
							}}
							render={({ field }) => (
								<TextInput
									{...field}
									aria-required={true}
									flexGrow={1}
									disabled={!allowEmailChange}
									addon={<Icon name={isUserVerified ? 'circle-check' : 'mail'} size='x20' />}
									error={errors.email?.message}
								/>
							)}
						/>
						{!isUserVerified && (
							<Button disabled={email !== previousEmail} onClick={handleSendConfirmationEmail}>
								{t('Resend_verification_email')}
							</Button>
						)}
					</FieldRow>
					{errors.email && <FieldError>{errors.email.message}</FieldError>}
					{!allowEmailChange && <FieldHint>{t('Email_Change_Disabled')}</FieldHint>}
				</Field>

				{customFieldsMetadata && <CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />}
			</FieldGroup>
		</Box>
	);
};

export default AccountProfileForm;
