import { ButtonGroup, Button, Box, Icon } from '@rocket.chat/fuselage';
import { SHA256 } from 'meteor/sha';
import React, { useMemo, useState, useCallback } from 'react';

import { getUserEmailAddress } from '../../../lib/getUserEmailAddress';
import ConfirmOwnerChangeWarningModal from '../../components/ConfirmOwnerChangeWarningModal';
import Page from '../../components/Page';
import { useSetModal } from '../../contexts/ModalContext';
import { useMethod } from '../../contexts/ServerContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useUser, useLogout } from '../../contexts/UserContext';
import { useForm } from '../../hooks/useForm';
import { useUpdateAvatar } from '../../hooks/useUpdateAvatar';
import AccountProfileForm from './AccountProfileForm';
import ActionConfirmModal from './ActionConfirmModal';

const getInitialValues = (user) => ({
	realname: user.name ?? '',
	email: getUserEmailAddress(user) ?? '',
	username: user.username ?? '',
	password: '',
	confirmationPassword: '',
	avatar: '',
	url: user.avatarUrl ?? '',
	statusText: user.statusText ?? '',
	statusType: user.status ?? '',
	bio: user.bio ?? '',
	customFields: user.customFields ?? {},
	nickname: user.nickname ?? '',
});

const AccountProfilePage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const user = useUser();

	const { values, handlers, hasUnsavedChanges, commit } = useForm(getInitialValues(user ?? {}));
	const [canSave, setCanSave] = useState(true);
	const setModal = useSetModal();
	const logout = useLogout();
	const [loggingOut, setLoggingOut] = useState(false);

	const logoutOtherClients = useMethod('logoutOtherClients');
	const deleteOwnAccount = useMethod('deleteUserOwnAccount');
	const saveFn = useMethod('saveUserProfile');

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const localPassword = Boolean(user?.services?.password?.exists);

	const erasureType = useSetting('Message_ErasureType');
	const allowRealNameChange = useSetting('Accounts_AllowRealNameChange');
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange');
	const allowUsernameChange = useSetting('Accounts_AllowUsernameChange');
	const allowEmailChange = useSetting('Accounts_AllowEmailChange');
	let allowPasswordChange = useSetting('Accounts_AllowPasswordChange');
	const allowOAuthPasswordChange = useSetting('Accounts_AllowPasswordChangeForOAuthUsers');
	const allowUserAvatarChange = useSetting('Accounts_AllowUserAvatarChange');
	const allowDeleteOwnAccount = useSetting('Accounts_AllowDeleteOwnAccount');
	const ldapEnabled = useSetting('LDAP_Enable');
	const ldapUsernameField = useSetting('LDAP_Username_Field');
	// whether the username is forced to match LDAP:
	const ldapUsernameLinked = ldapEnabled && ldapUsernameField;
	const requireName = useSetting('Accounts_RequireNameForSignUp');
	const namesRegexSetting = useSetting('UTF8_Names_Validation');

	if (allowPasswordChange && !allowOAuthPasswordChange) {
		allowPasswordChange = localPassword;
	}

	const namesRegex = useMemo(() => new RegExp(`^${namesRegexSetting}$`), [namesRegexSetting]);

	const canChangeUsername = allowUsernameChange && !ldapUsernameLinked;

	const settings = useMemo(
		() => ({
			allowRealNameChange,
			allowUserStatusMessageChange,
			allowEmailChange,
			allowPasswordChange,
			allowUserAvatarChange,
			allowDeleteOwnAccount,
			canChangeUsername,
			requireName,
			namesRegex,
		}),
		[
			allowDeleteOwnAccount,
			allowEmailChange,
			allowPasswordChange,
			allowRealNameChange,
			allowUserAvatarChange,
			allowUserStatusMessageChange,
			canChangeUsername,
			requireName,
			namesRegex,
		],
	);

	const {
		realname,
		email,
		avatar,
		username,
		password,
		statusText,
		statusType,
		customFields,
		bio,
		nickname,
	} = values;

	const { handleAvatar, handlePassword, handleConfirmationPassword } = handlers;

	const updateAvatar = useUpdateAvatar(avatar, user?._id);

	const onSave = useCallback(async () => {
		const save = async (typedPassword) => {
			try {
				await saveFn(
					{
						...(allowRealNameChange && { realname }),
						...(allowEmailChange && getUserEmailAddress(user) !== email && { email }),
						...(allowPasswordChange && { newPassword: password }),
						...(canChangeUsername && { username }),
						...(allowUserStatusMessageChange && { statusText }),
						...(typedPassword && { typedPassword: SHA256(typedPassword) }),
						statusType,
						nickname,
						bio: bio || '',
					},
					customFields,
				);
				handlePassword('');
				handleConfirmationPassword('');
				const avatarResult = await updateAvatar();
				if (avatarResult) {
					handleAvatar('');
				}
				commit();
				dispatchToastMessage({ type: 'success', message: t('Profile_saved_successfully') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		save();
	}, [
		saveFn,
		allowEmailChange,
		allowPasswordChange,
		allowRealNameChange,
		allowUserStatusMessageChange,
		bio,
		canChangeUsername,
		email,
		password,
		realname,
		statusText,
		username,
		user,
		updateAvatar,
		handleAvatar,
		dispatchToastMessage,
		t,
		customFields,
		statusType,
		commit,
		nickname,
		handlePassword,
		handleConfirmationPassword,
	]);

	const handleLogoutOtherLocations = useCallback(async () => {
		setLoggingOut(true);
		try {
			await logoutOtherClients();
			dispatchToastMessage({
				type: 'success',
				message: t('Logged_out_of_other_clients_successfully'),
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		setLoggingOut(false);
	}, [logoutOtherClients, dispatchToastMessage, t]);

	const handleConfirmOwnerChange = useCallback(
		(passwordOrUsername, shouldChangeOwner, shouldBeRemoved) => {
			const handleConfirm = async () => {
				try {
					await deleteOwnAccount(SHA256(passwordOrUsername), true);
					dispatchToastMessage({ type: 'success', message: t('User_has_been_deleted') });
					closeModal();
					logout();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			};

			return setModal(() => (
				<ConfirmOwnerChangeWarningModal
					onConfirm={handleConfirm}
					onCancel={closeModal}
					contentTitle={t(`Delete_User_Warning_${erasureType}`)}
					confirmLabel={t('Delete')}
					shouldChangeOwner={shouldChangeOwner}
					shouldBeRemoved={shouldBeRemoved}
				/>
			));
		},
		[closeModal, erasureType, setModal, t, deleteOwnAccount, dispatchToastMessage, logout],
	);

	const handleDeleteOwnAccount = useCallback(async () => {
		const handleConfirm = async (passwordOrUsername) => {
			try {
				await deleteOwnAccount(SHA256(passwordOrUsername));
				dispatchToastMessage({ type: 'success', message: t('User_has_been_deleted') });
				logout();
			} catch (error) {
				if (error.error === 'user-last-owner') {
					const { shouldChangeOwner, shouldBeRemoved } = error.details;
					return handleConfirmOwnerChange(passwordOrUsername, shouldChangeOwner, shouldBeRemoved);
				}

				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		return setModal(() => (
			<ActionConfirmModal
				onConfirm={handleConfirm}
				onCancel={closeModal}
				isPassword={localPassword}
			/>
		));
	}, [
		closeModal,
		dispatchToastMessage,
		localPassword,
		setModal,
		handleConfirmOwnerChange,
		deleteOwnAccount,
		logout,
		t,
	]);

	return (
		<Page>
			<Page.Header title={t('Profile')}>
				<ButtonGroup>
					<Button primary disabled={!hasUnsavedChanges || !canSave || loggingOut} onClick={onSave}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='600px' w='full' alignSelf='center'>
					<AccountProfileForm
						values={values}
						handlers={handlers}
						user={user ?? { emails: [] }}
						settings={settings}
						onSaveStateChange={setCanSave}
					/>
					<ButtonGroup stretch mb='x12'>
						<Button onClick={handleLogoutOtherLocations} flexGrow={0} disabled={loggingOut}>
							{t('Logout_Others')}
						</Button>
						{allowDeleteOwnAccount && (
							<Button danger onClick={handleDeleteOwnAccount}>
								<Icon name='trash' size='x20' mie='x4' />
								{t('Delete_my_account')}
							</Button>
						)}
					</ButtonGroup>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default AccountProfilePage;
