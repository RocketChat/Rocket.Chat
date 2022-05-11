import {
	Field,
	FieldGroup,
	TextInput,
	TextAreaInput,
	Box,
	Icon,
	AnimatedVisibility,
	PasswordInput,
	Button,
	Grid,
	Margins,
	Flex,
} from '@rocket.chat/fuselage';
import { useDebouncedCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo, useEffect, useState } from 'react';

import { validateEmail } from '../../../lib/emailValidator';
import { getUserEmailAddress } from '../../../lib/getUserEmailAddress';
import CustomFieldsForm from '../../components/CustomFieldsForm';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../components/UserStatus';
import UserStatusMenu from '../../components/UserStatusMenu';
import UserAvatarEditor from '../../components/avatar/UserAvatarEditor';
import AccountInfo from './AccountInfo';

function AccountProfileForm({ values, handlers, user, settings, onSaveStateChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const checkUsernameAvailability = useMethod('checkUsernameAvailability');
	const getAvatarSuggestions = useMethod('getAvatarSuggestion');
	const sendConfirmationEmail = useMethod('sendConfirmationEmail');

	const [usernameError, setUsernameError] = useState();
	const [avatarSuggestions, setAvatarSuggestions] = useSafely(useState());

	const {
		allowRealNameChange,
		allowUserStatusMessageChange,
		allowEmailChange,
		allowPasswordChange,
		allowUserAvatarChange,
		canChangeUsername,
		namesRegex,
		requireName,
	} = settings;

	const { realname, email, username, password, confirmationPassword, statusText, bio, statusType, customFields, nickname } = values;

	const {
		handleRealname,
		handleEmail,
		handleUsername,
		handlePassword,
		handleConfirmationPassword,
		handleAvatar,
		handleStatusText,
		handleStatusType,
		handleBio,
		handleCustomFields,
		handleNickname,
	} = handlers;

	const previousEmail = getUserEmailAddress(user);

	const handleSendConfirmationEmail = useCallback(async () => {
		if (email !== previousEmail) {
			return;
		}
		try {
			await sendConfirmationEmail(email);
			dispatchToastMessage({ type: 'success', message: t('Verification_email_sent') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, email, previousEmail, sendConfirmationEmail, t]);

	const passwordError = useMemo(
		() => (!password || !confirmationPassword || password === confirmationPassword ? undefined : t('Passwords_do_not_match')),
		[t, password, confirmationPassword],
	);
	const emailError = useMemo(() => (validateEmail(email) ? undefined : 'error-invalid-email-address'), [email]);
	const checkUsername = useDebouncedCallback(
		async (username) => {
			if (user.username === username) {
				return setUsernameError(undefined);
			}
			if (!namesRegex.test(username)) {
				return setUsernameError(t('error-invalid-username'));
			}
			const isAvailable = await checkUsernameAvailability(username);
			if (!isAvailable) {
				return setUsernameError(t('Username_already_exist'));
			}
			setUsernameError(undefined);
		},
		400,
		[namesRegex, t, user.username, checkUsernameAvailability, setUsernameError],
	);

	useEffect(() => {
		const getSuggestions = async () => {
			const suggestions = await getAvatarSuggestions();
			setAvatarSuggestions(suggestions);
		};
		getSuggestions();
	}, [getAvatarSuggestions, setAvatarSuggestions]);

	useEffect(() => {
		checkUsername(username);
	}, [checkUsername, username]);

	useEffect(() => {
		if (!password) {
			handleConfirmationPassword('');
		}
	}, [password, handleConfirmationPassword]);

	const nameError = useMemo(() => {
		if (user.name === realname) {
			return undefined;
		}
		if (!realname && requireName) {
			return t('Field_required');
		}
	}, [realname, requireName, t, user.name]);

	const statusTextError = useMemo(() => {
		if (statusText && statusText.length > USER_STATUS_TEXT_MAX_LENGTH) {
			return t('Max_length_is', USER_STATUS_TEXT_MAX_LENGTH);
		}

		return undefined;
	}, [statusText, t]);
	const {
		emails: [{ verified = false } = { verified: false }],
	} = user;

	const canSave = !![!!passwordError, !!emailError, !!usernameError, !!nameError, !!statusTextError].filter(Boolean);

	useEffect(() => {
		onSaveStateChange(canSave);
	}, [canSave, onSaveStateChange]);

	const handleSubmit = useCallback((e) => {
		e.preventDefault();
	}, []);

	const careerItems = [
		{icon: 'user', content: 'Employee/er/broker', rc: true},
		{icon: 'credit', content: 'Credit point: 343', rc: false},
		{icon: 'trust-score', content: 'Trust score: 60/100', rc: false},
	]

	const privateInfo = [
		{icon: 'mail', content: 'ryan@gmail.com', rc: true},
		{icon: 'phone', content: '+254 730430234', rc: true},
		{icon: 'gender', content: 'Male', rc: false},
	]

	const services = [
		{icon: 'lock', content: 'Update profile/Chan', rc: true},
		{icon: 'info', content: 'Customer support', rc: false},
		{icon: 'credit-card', content: 'Verify identity', rc: false},
		{icon: 'info', content: 'About us', rc: false},
	]

	return (
		<FieldGroup is='form' style={{marginTop: '0px !important'}} autoComplete='off' onSubmit={handleSubmit} {...props}>
			{useMemo(
				() => (
					<Field>
						<UserAvatarEditor
							etag={user.avatarETag}
							currentUsername={user.username}
							username={username}
							setAvatarObj={handleAvatar}
							disabled={!allowUserAvatarChange}
							suggestions={avatarSuggestions}
						/>
					</Field>
				),
				[username, user.username, handleAvatar, allowUserAvatarChange, avatarSuggestions, user.avatarETag],
			)}
				<Box style={{ margin: '0px auto', fontSize: '16px' }}>I'm a fullstack developer with interests in the NFT space and E-commerce space.</Box>
			<Box display='flex' flexDirection='column' style={{marginTop: '30px'}}>
				<AccountInfo title='Career' items={careerItems} />
				<AccountInfo title='Private Information' items={privateInfo} />
				<AccountInfo title='Services' items={services} />
			</Box>
			<CustomFieldsForm customFieldsData={customFields} setCustomFieldsData={handleCustomFields} />
		</FieldGroup>
	);
}

export default AccountProfileForm;
