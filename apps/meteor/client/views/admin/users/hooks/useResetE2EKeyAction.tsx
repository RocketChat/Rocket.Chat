import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useSetting, usePermission, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import GenericModal from '../../../../components/GenericModal';

export const useResetE2EKeyAction = (_id) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const handleCloseModal = useMutableCallback(() => setModal());
	const canResetE2EEKey = usePermission('edit-other-user-e2ee');
	const enforcePassword = useSetting('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback');
	const resetE2EEKeyRequest = useEndpoint('POST', '/v1/users.resetE2EKey');

	const resetE2EEKey = useCallback(async () => {
		handleCloseModal();
		const result = await resetE2EEKeyRequest({ userId: _id });

		if (result) {
			setModal(
				<GenericModal variant='success' onClose={handleCloseModal} onConfirm={handleCloseModal}>
					{t('Users_key_has_been_reset')}
				</GenericModal>,
			);
		}
	}, [resetE2EEKeyRequest, setModal, t, _id, handleCloseModal]);

	const confirmResetE2EEKey = useCallback(() => {
		setModal(
			<GenericModal variant='danger' onConfirm={resetE2EEKey} onCancel={handleCloseModal} confirmText={t('Reset')}>
				{t('E2E_Reset_Other_Key_Warning')}
			</GenericModal>,
		);
	}, [resetE2EEKey, t, setModal, handleCloseModal]);

	return canResetE2EEKey && enforcePassword
		? {
				icon: 'key',
				label: t('Reset_E2E_Key'),
				action: confirmResetE2EEKey,
		  }
		: undefined;
};
