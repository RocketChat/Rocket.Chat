import { IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useSetting, usePermission, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import GenericModal from '../../../../components/GenericModal';
import { Action } from '../../../hooks/useActionSpread';

export const useResetTOTPAction = (userId: IUser['_id']): Action | undefined => {
	const t = useTranslation();
	const setModal = useSetModal();
	const handleCloseModal = useMutableCallback(() => setModal());
	const canResetTOTP = usePermission('edit-other-user-totp');
	const resetTOTPRequest = useEndpoint('POST', '/v1/users.resetTOTP');
	const enforcePassword = useSetting('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback');

	const resetTOTP = useCallback(async () => {
		setModal();
		const result = await resetTOTPRequest({ userId });

		if (result) {
			setModal(
				<GenericModal variant='success' onClose={handleCloseModal} onConfirm={handleCloseModal}>
					{t('Users_TOTP_has_been_reset')}
				</GenericModal>,
			);
		}
	}, [resetTOTPRequest, setModal, t, userId, handleCloseModal]);

	const confirmResetTOTP = useCallback(() => {
		setModal(
			<GenericModal variant='danger' onConfirm={resetTOTP} onCancel={handleCloseModal} confirmText={t('Reset')}>
				{t('TOTP_Reset_Other_Key_Warning')}
			</GenericModal>,
		);
	}, [resetTOTP, t, setModal, handleCloseModal]);

	return canResetTOTP && enforcePassword
		? {
				icon: 'key',
				label: t('Reset_TOTP'),
				action: confirmResetTOTP,
		  }
		: undefined;
};
