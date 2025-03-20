import { ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { SHA256 } from '@rocket.chat/sha256';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import {
	useSetModal,
	useToastMessageDispatch,
	useUser,
	useLogout,
	useEndpoint,
	useTranslation,
	useSetting,
} from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useId, useState, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import AccountProfileForm from './AccountProfileForm';
import ActionConfirmModal from './ActionConfirmModal';
import { getProfileInitialValues } from './getProfileInitialValues';
import ConfirmOwnerChangeModal from '../../../components/ConfirmOwnerChangeModal';
import { Page, PageFooter, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import { useAllowPasswordChange } from '../security/useAllowPasswordChange';

// TODO: enforce useMutation
const AccountProfilePage = (): ReactElement => {
	const t = useTranslation();
	const user = useUser();
	const dispatchToastMessage = useToastMessageDispatch();

	const setModal = useSetModal();
	const logout = useLogout();
	const [loggingOut, setLoggingOut] = useState(false);

	const erasureType = useSetting('Message_ErasureType');
	const allowDeleteOwnAccount = useSetting('Accounts_AllowDeleteOwnAccount');
	const { hasLocalPassword } = useAllowPasswordChange();

	const methods = useForm({
		defaultValues: getProfileInitialValues(user),
		mode: 'onBlur',
	});

	const {
		reset,
		formState: { isDirty, isSubmitting },
	} = methods;

	const logoutOtherClients = useEndpoint('POST', '/v1/users.logoutOtherClients');
	const deleteOwnAccount = useEndpoint('POST', '/v1/users.deleteOwnAccount');

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
		(passwordOrUsername: string, shouldChangeOwner: string[], shouldBeRemoved: string[]) => {
			const handleConfirm = async (): Promise<void> => {
				try {
					await deleteOwnAccount({ password: SHA256(passwordOrUsername), confirmRelinquish: true });
					dispatchToastMessage({ type: 'success', message: t('User_has_been_deleted') });
					setModal(null);
					logout();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			};

			return setModal(
				<ConfirmOwnerChangeModal
					onConfirm={handleConfirm}
					onCancel={() => setModal(null)}
					contentTitle={t(`Delete_User_Warning_${erasureType}` as TranslationKey)}
					confirmText={t('Delete')}
					shouldChangeOwner={shouldChangeOwner}
					shouldBeRemoved={shouldBeRemoved}
				/>,
			);
		},
		[erasureType, setModal, t, deleteOwnAccount, dispatchToastMessage, logout],
	);

	const handleDeleteOwnAccount = useCallback(async () => {
		const handleConfirm = async (passwordOrUsername: string): Promise<void> => {
			try {
				await deleteOwnAccount({ password: SHA256(passwordOrUsername) });
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

		return setModal(<ActionConfirmModal onConfirm={handleConfirm} onCancel={() => setModal(null)} isPassword={hasLocalPassword} />);
	}, [dispatchToastMessage, hasLocalPassword, setModal, handleConfirmOwnerChange, deleteOwnAccount, logout, t]);

	const profileFormId = useId();

	return (
		<Page>
			<PageHeader title={t('Profile')} />
			<PageScrollableContentWithShadow>
				<Box maxWidth='600px' w='full' alignSelf='center'>
					<FormProvider {...methods}>
						<AccountProfileForm id={profileFormId} />
					</FormProvider>
					<Box mb={12}>
						<ButtonGroup stretch>
							<Button onClick={handleLogoutOtherLocations} flexGrow={0} loading={loggingOut}>
								{t('Logout_Others')}
							</Button>
							{allowDeleteOwnAccount && (
								<Button icon='trash' danger onClick={handleDeleteOwnAccount}>
									{t('Delete_my_account')}
								</Button>
							)}
						</ButtonGroup>
					</Box>
				</Box>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty}>
				<ButtonGroup>
					<Button disabled={!isDirty} onClick={() => reset(getProfileInitialValues(user))}>
						{t('Cancel')}
					</Button>
					<Button
						form={profileFormId}
						data-qa='AccountProfilePageSaveButton'
						primary
						disabled={!isDirty || loggingOut}
						loading={isSubmitting}
						type='submit'
					>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default AccountProfilePage;
