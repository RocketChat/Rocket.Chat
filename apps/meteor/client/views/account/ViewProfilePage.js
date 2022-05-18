import { ButtonGroup, Button, Box, Icon } from '@rocket.chat/fuselage';
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
import { FlowRouter } from 'meteor/kadira:flow-router';
import { SHA256 } from 'meteor/sha';
import React, { useMemo, useState, useCallback } from 'react';

import { getUserEmailAddress } from '../../../lib/getUserEmailAddress';
import ConfirmOwnerChangeWarningModal from '../../components/ConfirmOwnerChangeWarningModal';
import Page from '../../components/Page';
import { useForm } from '../../hooks/useForm';
import ActionConfirmModal from './ActionConfirmModal';
import ViewProfileForm from './ViewProfileForm';

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

const ViewProfilePage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const user = useUser();

	const { values, handlers, hasUnsavedChanges, reset } = useForm(getInitialValues(user ?? {}));
	const setModal = useSetModal();
	const logout = useLogout();
	const [loggingOut, setLoggingOut] = useState(false);

	const logoutOtherClients = useEndpoint('POST', 'users.logoutOtherClients');
	const deleteOwnAccount = useMethod('deleteUserOwnAccount');

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const localPassword = Boolean(user?.services?.password?.exists);

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

	const handleEdit = () => {
		FlowRouter.go('/account/profile');
	};

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

		return setModal(() => <ActionConfirmModal onConfirm={handleConfirm} onCancel={closeModal} isPassword={localPassword} />);
	}, [closeModal, dispatchToastMessage, localPassword, setModal, handleConfirmOwnerChange, deleteOwnAccount, logout, t]);

	return (
		<Page>
			<Page.Header title={t('Profile')}>
				<ButtonGroup>
					<Button primary danger disabled={!hasUnsavedChanges} onClick={reset}>
						{t('Reset')}
					</Button>
					<Button primary onClick={handleEdit}>
						{t('gso_viewProfilePage_btnEdit')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='600px' w='full' alignSelf='center'>
					<ViewProfileForm values={values} handlers={handlers} user={user ?? { emails: [] }} settings={settings} />
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

export default ViewProfilePage;
