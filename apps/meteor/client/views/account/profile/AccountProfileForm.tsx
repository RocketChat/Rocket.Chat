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

	const handleSave = async ({ email, name, username, statusType, statusText, nickname, bio, customFields }: AccountProfileFormValues) => {
		try {
			await updateOwnBasicInfo({
				data: {
					name,
					...(user ? getUserEmailAddress(user) !== email && { email } : {}),
					username,
					statusText,
					statusType,
					nickname,
					bio,
				},
				customFields,
			});
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
				<VisuallyHidden>
					<legend>{t('Profile_details')}</legend>
				</VisuallyHidden>

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

				<Box display='flex' flexDirection={isMobile ? 'column' : 'row'} className={css`gap: 16px;`}>
					<Field>
						<FieldLabel required htmlFor={nameId}>{t('Name')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='name'
								rules={{ required: requireName && t('Required_field', { field: t('Name') }) }}
								render={({ field }) => (
									<TextInput
										{...field}
										id={nameId}
										onChange={(e) => field.onChange(e.target.value.trim())}
										error={errors.name?.message}
										disabled={!allowRealNameChange}
									/>
								)}
							/>
						</FieldRow>
					</Field>

					<Field>
						<FieldLabel required htmlFor={usernameId}>{t('Username')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='username'
								rules={{ required: t('Required_field', { field: t('Username') }), validate: validateUsername }}
								render={({ field }) => (
									<TextInput
										{...field}
										id={usernameId}
										onChange={(e) => field.onChange(e.target.value.trim())}
										disabled={!canChangeUsername}
										addon={<Icon name='at' size='x20' />}
									/>
								)}
							/>
						</FieldRow>
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
									onChange={(e) => field.onChange(e.target.value.trim())}
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

				<Field>
					<FieldLabel htmlFor={nicknameId}>{t('Nickname')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='nickname'
							render={({ field }) => (
								<TextInput {...field} id={nicknameId} onChange={(e) => field.onChange(e.target.value.trim())} />
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
									onChange={(e) => field.onChange(e.target.value.trim())}
									rows={3}
								/>
							)}
						/>
					</FieldRow>
				</Field>

				<Field>
					<FieldLabel required htmlFor={emailId}>{t('Email')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='email'
							rules={{ required: t('Required_field', { field: t('Email') }), validate: validateEmail }}
							render={({ field }) => (
								<TextInput
									{...field}
									id={emailId}
									onChange={(e) => field.onChange(e.target.value.trim())}
									disabled={!allowEmailChange}
									addon={<Icon name={isUserVerified ? 'circle-check' : 'mail'} size='x20' />}
								/>
							)}
						/>
					</FieldRow>
				</Field>

				{customFieldsMetadata && <CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />}
			</FieldGroup>
		</Box>
	);
};

export default AccountProfileForm;
