import type { AvatarObject, IUser } from '@rocket.chat/core-typings';
import { ButtonGroup, Button, Box, Icon } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import {
	useSetModal,
	useToastMessageDispatch,
	useUser,
	useLogout,
	useSetting,
	useEndpoint,
	useMethod,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import { SHA256 } from 'meteor/sha';
import type { ReactElement } from 'react';
import React, { useMemo, useState, useCallback } from 'react';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import ConfirmOwnerChangeModal from '../../../components/ConfirmOwnerChangeModal';
import Page from '../../../components/Page';
import { useForm } from '../../../hooks/useForm';
import { useUpdateAvatar } from '../../../hooks/useUpdateAvatar';
import AccountProfileForm from './AccountProfileForm';
import ActionConfirmModal from './ActionConfirmModal';

export type AccountFormValues = {
	realname: string;
	email: string;
	username: string;
	password: string;
	confirmationPassword: string;
	avatar: AvatarObject;
	url: string;
	statusText: string;
	statusType: string;
	bio: string;
	customFields: Record<string, string>;
	nickname: string;
};

const getInitialValues = (user: IUser | null): AccountFormValues => ({
	realname: user?.name ?? '',
	email: user ? getUserEmailAddress(user) || '' : '',
	username: user?.username ?? '',
	password: '',
	confirmationPassword: '',
	avatar: '' as AvatarObject,
	url: '',
	statusText: user?.statusText ?? '',
	statusType: user?.status ?? '',
	bio: user?.bio ?? '',
	customFields: user?.customFields ?? {},
	nickname: user?.nickname ?? '',
});

const AccountProfilePage = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const user = useUser();

	const { values, handlers, hasUnsavedChanges, commit, reset } = useForm(getInitialValues(user));
	const [canSave, setCanSave] = useState(true);
	const setModal = useSetModal();
	const logout = useLogout();
	const [loggingOut, setLoggingOut] = useState(false);

	const logoutOtherClients = useEndpoint('POST', '/v1/users.logoutOtherClients');
	const deleteOwnAccount = useMethod('deleteUserOwnAccount');
	const saveFn = useMethod('saveUserProfile');

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const localPassword = Boolean(user?.services?.password?.bcrypt);

	const erasureType = useSetting('Message_ErasureType');
	const allowRealNameChange = useSetting('Accounts_AllowRealNameChange');
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange');
	const canChangeUsername = useSetting('Accounts_AllowUsernameChange');
	const allowEmailChange = useSetting('Accounts_AllowEmailChange');
	let allowPasswordChange = useSetting('Accounts_AllowPasswordChange');
	const allowOAuthPasswordChange = useSetting('Accounts_AllowPasswordChangeForOAuthUsers');
	const allowUserAvatarChange = useSetting('Accounts_AllowUserAvatarChange');
	const allowDeleteOwnAccount = useSetting('Accounts_AllowDeleteOwnAccount');
	const requireName = useSetting('Accounts_RequireNameForSignUp');
	const namesRegexSetting = useSetting('UTF8_User_Names_Validation');

	if (allowPasswordChange && !allowOAuthPasswordChange) {
		allowPasswordChange = localPassword;
	}

	const namesRegex = useMemo(() => new RegExp(`^${namesRegexSetting}$`), [namesRegexSetting]);

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

	const { realname, email, avatar, username, password, statusText, statusType, customFields, bio, nickname } = values as AccountFormValues;

	const { handleAvatar, handlePassword, handleConfirmationPassword } = handlers;

	const updateAvatar = useUpdateAvatar(avatar, user?._id || '');

	const onSave = useCallback(async () => {
		const save = async (typedPassword?: string): Promise<void> => {
			try {
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
			} catch (error: unknown) {
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
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		setLoggingOut(false);
	}, [logoutOtherClients, dispatchToastMessage, t]);

	const handleConfirmOwnerChange = useCallback(
		(passwordOrUsername, shouldChangeOwner, shouldBeRemoved) => {
			const handleConfirm = async (): Promise<void> => {
				try {
					await deleteOwnAccount(SHA256(passwordOrUsername), true);
					dispatchToastMessage({ type: 'success', message: t('User_has_been_deleted') });
					closeModal();
					logout();
				} catch (error: unknown) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			};

			return setModal(() => (
				<ConfirmOwnerChangeModal
					onConfirm={handleConfirm}
					onCancel={closeModal}
					contentTitle={t(`Delete_User_Warning_${erasureType}` as TranslationKey)}
					confirmText={t('Delete')}
					shouldChangeOwner={shouldChangeOwner}
					shouldBeRemoved={shouldBeRemoved}
				/>
			));
		},
		[closeModal, erasureType, setModal, t, deleteOwnAccount, dispatchToastMessage, logout],
	);

	const handleDeleteOwnAccount = useCallback(async () => {
		const handleConfirm = async (passwordOrUsername: string): Promise<void> => {
			try {
				await deleteOwnAccount(SHA256(passwordOrUsername));
				dispatchToastMessage({ type: 'success', message: t('User_has_been_deleted') });
				logout();
			} catch (error: any) {
				if (error.error === 'user-last-owner') {
					const { shouldChangeOwner, shouldBeRemoved } = error.details;
					return handleConfirmOwnerChange(passwordOrUsername, shouldChangeOwner, shouldBeRemoved);
				}

				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		return setModal(() => <ActionConfirmModal onConfirm={handleConfirm} onCancel={closeModal} isPassword={localPassword} />);
	}, [closeModal, dispatchToastMessage, localPassword, setModal, handleConfirmOwnerChange, deleteOwnAccount, logout, t]);

	return (
		<Page>
			<Page.Header title={t('Profile')}>
				<ButtonGroup>
					<Button danger disabled={!hasUnsavedChanges} onClick={reset}>
						{t('Reset')}
					</Button>
					<Button data-qa='AccountProfilePageSaveButton' primary disabled={!hasUnsavedChanges || !canSave || loggingOut} onClick={onSave}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='600px' w='full' alignSelf='center'>
					<AccountProfileForm values={values} handlers={handlers} user={user} settings={settings} onSaveStateChange={setCanSave} />
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
