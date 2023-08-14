import type { IUser } from '@rocket.chat/core-typings';
import { useSetModal, usePermission, useSetting, useEndpoint, useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import GenericModal from '../../../../components/GenericModal';
import type { Action } from '../../../hooks/useActionSpread';

export const useResetTOTPAction = (userId: IUser['_id']): Action | undefined => {
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
				label: t('Reset_TOTP'),
				action: confirmResetTOTP,
		  }
		: undefined;
};
