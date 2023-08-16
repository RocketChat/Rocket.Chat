import type { AvatarObject, IUser } from '@rocket.chat/core-typings';
import { ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { SHA256 } from '@rocket.chat/sha256';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetModal, useToastMessageDispatch, useUser, useLogout, useEndpoint, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import ConfirmOwnerChangeModal from '../../../components/ConfirmOwnerChangeModal';
import Page from '../../../components/Page';
// import { useForm } from '../../../hooks/useForm';
import AccountProfileForm from './AccountProfileForm';
import ActionConfirmModal from './ActionConfirmModal';
import { useAccountProfileSettings } from './useAccountProfileSettings';
import { useAllowPasswordChange } from './useAllowPasswordChange';

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
	const user = useUser();
	const dispatchToastMessage = useToastMessageDispatch();

	const methods = useForm({
		defaultValues: getInitialValues(user),
		mode: 'onBlur',
	});

	const {
		watch,
		reset,
		formState: { isDirty },
	} = methods;
	const { realname, email, avatar, username, password, confirmationPassword, statusText, statusType, customFields, bio, nickname } =
		watch();

	// const { values, handlers, hasUnsavedChanges, commit, reset } = useForm(getInitialValues(user));
	const [canSave, setCanSave] = useState(true);
	const setModal = useSetModal();
	const logout = useLogout();
	const [loggingOut, setLoggingOut] = useState(false);

	const logoutOtherClients = useEndpoint('POST', '/v1/users.logoutOtherClients');
	const deleteOwnAccount = useMethod('deleteUserOwnAccount');

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
	const { allowPasswordChange, hasLocalPassword } = useAllowPasswordChange();

	// const { realname, email, avatar, username, password, statusText, statusType, customFields, bio, nickname } = values as AccountFormValues;

	// const { handleAvatar, handlePassword, handleConfirmationPassword } = handlers;

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
					setModal(null);
					logout();
				} catch (error: unknown) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			};

			return setModal(() => (
				<ConfirmOwnerChangeModal
					onConfirm={handleConfirm}
					onCancel={() => setModal(null)}
					contentTitle={t(`Delete_User_Warning_${erasureType}` as TranslationKey)}
					confirmText={t('Delete')}
					shouldChangeOwner={shouldChangeOwner}
					shouldBeRemoved={shouldBeRemoved}
				/>
			));
		},
		[erasureType, setModal, t, deleteOwnAccount, dispatchToastMessage, logout],
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

		return setModal(() => <ActionConfirmModal onConfirm={handleConfirm} onCancel={() => setModal(null)} isPassword={hasLocalPassword} />);
	}, [dispatchToastMessage, hasLocalPassword, setModal, handleConfirmOwnerChange, deleteOwnAccount, logout, t]);

	const profileFormId = useUniqueId();

	return (
		<Page>
			<Page.Header title={t('Profile')} />
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='600px' w='full' alignSelf='center'>
					<FormProvider {...methods}>
						<AccountProfileForm id={profileFormId} />
					</FormProvider>
					<ButtonGroup stretch mb={12}>
						<Button onClick={handleLogoutOtherLocations} flexGrow={0} disabled={loggingOut}>
							{t('Logout_Others')}
						</Button>
						{allowDeleteOwnAccount && (
							<Button icon='trash' danger onClick={handleDeleteOwnAccount}>
								{t('Delete_my_account')}
							</Button>
						)}
					</ButtonGroup>
				</Box>
			</Page.ScrollableContentWithShadow>
			<Page.Footer isDirty={isDirty}>
				<ButtonGroup>
					<Button disabled={!isDirty} onClick={() => reset(getInitialValues(user))}>
						{t('Cancel')}
					</Button>
					<Button
						form={profileFormId}
						data-qa='AccountProfilePageSaveButton'
						primary
						disabled={!isDirty || !canSave || loggingOut}
						type='submit'
					>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Page.Footer>
		</Page>
	);
};

export default AccountProfilePage;
