import type { IUser } from '@rocket.chat/core-typings';
import { useSetModal, usePermission, useSetting, useEndpoint, useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import type { AdminUserAction } from './useAdminUserInfoActions';
import GenericModal from '../../../../components/GenericModal';

export const useResetTOTPAction = (userId: IUser['_id']): AdminUserAction | undefined => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const canResetTOTP = usePermission('edit-other-user-totp');
	const twoFactorEnabled = useSetting('Accounts_TwoFactorAuthentication_Enabled');
	const resetTOTPRequest = useEndpoint('POST', '/v1/users.resetTOTP');

	const resetTOTP = useCallback(async () => {
		try {
			await resetTOTPRequest({ userId });
			dispatchToastMessage({ type: 'success', message: t('Users_TOTP_has_been_reset') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setModal();
		}
	}, [resetTOTPRequest, setModal, t, userId, dispatchToastMessage]);

	const confirmResetTOTP = useCallback(() => {
		setModal(
			<GenericModal variant='danger' onConfirm={resetTOTP} onCancel={(): void => setModal()} confirmText={t('Reset')}>
				{t('TOTP_Reset_Other_Key_Warning')}
			</GenericModal>,
		);
	}, [resetTOTP, t, setModal]);

	return canResetTOTP && twoFactorEnabled
		? {
				icon: 'key',
				content: t('Reset_TOTP'),
				onClick: confirmResetTOTP,
			}
		: undefined;
};
