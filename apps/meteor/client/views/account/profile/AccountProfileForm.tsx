import type { IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
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
import { validateEmail } from '@rocket.chat/tools';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import {
	useAccountsCustomFields,
	useToastMessageDispatch,
	useTranslation,
	useEndpoint,
	useUser,
	useLayout,
} from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { AllHTMLAttributes, ReactElement } from 'react';
import { useId, useCallback } from 'react';
import { VisuallyHidden } from 'react-aria';
import { Controller, useFormContext } from 'react-hook-form';

import type { AccountProfileFormValues } from './getProfileInitialValues';
import { useAccountProfileSettings } from './useAccountProfileSettings';
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

	const { email, avatar, username, name, statusType, statusText, nickname, bio, customFields } = watch();

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
		if (!username || username === previousUsername) {
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

	const updateOwnBasicInfo = useEndpoint('POST', '/v1/users.updateOwnBasicInfo');
	const updateAvatar = useUpdateAvatar(avatar, user?._id || '');

	const handleSave = async (values: AccountProfileFormValues) => {
		const trimmedValues = {
			...values,
			email: values.email?.trim(),
			name: values.name?.trim(),
			username: values.username?.trim(),
			statusText: values.statusText?.trim(),
			nickname: values.nickname?.trim(),
			bio: values.bio?.trim(),
		};

		try {
			await updateOwnBasicInfo({
				data: {
					name: trimmedValues.name,
					...(user && getUserEmailAddress(user) !== trimmedValues.email && { email: trimmedValues.email }),
					username: trimmedValues.username,
					statusText: trimmedValues.statusText,
					statusType: trimmedValues.statusType,
					nickname: trimmedValues.nickname,
					bio: trimmedValues.bio,
				},
				customFields: trimmedValues.customFields,
			});

			await updateAvatar();
			dispatchToastMessage({ type: 'success', message: t('Profile_saved_successfully') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			reset(trimmedValues);
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
				<VisuallyHidden>
					<legend>{t('Profile_details')}</legend>
				</VisuallyHidden>

				{/* Avatar */}
				<Field>
					<Controller
						control={control}
						name='avatar'
						render={({ field: { onChange } }) => (
							<UserAvatarEditor
								etag={user?.avatarETag}
								currentUsername={user?.username}
								name={name}
								username={username}
								setAvatarObj={onChange}
								disabled={!allowUserAvatarChange}
							/>
						)}
					/>
				</Field>

				{/* Name + Username */}
				<Box display='flex' flexDirection={isMobile ? 'column' : 'row'} gap='x16'>
					<Field>
						<FieldLabel required htmlFor={nameId}>
							{t('Name')}
						</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='name'
								rules={{ required: requireName && t('Required_field', { field: t('Name') }) }}
								render={({ field }) => (
									<TextInput {...field} id={nameId} disabled={!allowRealNameChange} error={errors.name?.message} />
								)}
							/>
						</FieldRow>
						{errors.name && <FieldError>{errors.name.message}</FieldError>}
					</Field>

					<Field>
						<FieldLabel required htmlFor={usernameId}>
							{t('Username')}
						</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='username'
								rules={{ validate: validateUsername }}
								render={({ field }) => (
									<TextInput {...field} id={usernameId} disabled={!canChangeUsername} addon={<Icon name='at' />} />
								)}
							/>
						</FieldRow>
						{errors.username && <FieldError>{errors.username.message}</FieldError>}
					</Field>
				</Box>

				{/* Status */}
				<Field>
					<FieldLabel htmlFor={statusTextId}>{t('StatusMessage')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='statusText'
							rules={{ maxLength: USER_STATUS_TEXT_MAX_LENGTH }}
							render={({ field }) => (
								<TextInput
									{...field}
									id={statusTextId}
									disabled={!allowUserStatusMessageChange}
									addon={
										<Controller
											control={control}
											name='statusType'
											render={({ field: { value, onChange } }) => (
												<UserStatusMenu onChange={onChange} initialStatus={value as IUser['status']} />
											)}
										/>
									}
								/>
							)}
						/>
					</FieldRow>
				</Field>

				{/* Nickname */}
				<Field>
					<FieldLabel htmlFor={nicknameId}>{t('Nickname')}</FieldLabel>
					<FieldRow>
						<Controller control={control} name='nickname' render={({ field }) => <TextInput {...field} />} />
					</FieldRow>
				</Field>

				{/* Bio */}
				<Field>
					<FieldLabel htmlFor={bioId}>{t('Bio')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='bio'
							rules={{ maxLength: BIO_TEXT_MAX_LENGTH }}
							render={({ field }) => <TextAreaInput {...field} rows={3} />}
						/>
					</FieldRow>
				</Field>

				{/* Email */}
				<Field>
					<FieldLabel required htmlFor={emailId}>
						{t('Email')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='email'
							rules={{ validate: (email) => (validateEmail(email) ? undefined : t('error-invalid-email-address')) }}
							render={({ field }) => <TextInput {...field} disabled={!allowEmailChange} />}
						/>
						{!isUserVerified && (
							<Button disabled={email !== previousEmail} onClick={handleSendConfirmationEmail}>
								{t('Resend_verification_email')}
							</Button>
						)}
					</FieldRow>
				</Field>

				{customFieldsMetadata && <CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />}
			</FieldGroup>
		</Box>
	);
};

export default AccountProfileForm;
