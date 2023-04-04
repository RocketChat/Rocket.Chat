import type { IUser } from '@rocket.chat/core-typings';
import { useSetModal, useSetting, usePermission, useEndpoint, useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import GenericModal from '../../../../components/GenericModal';
import type { Action } from '../../../hooks/useActionSpread';

export const useResetE2EEKeyAction = (userId: IUser['_id']): Action | undefined => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const canResetE2EEKey = usePermission('edit-other-user-e2ee');
	const enforcePassword = useSetting('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback');
	const resetE2EEKeyRequest = useEndpoint('POST', '/v1/users.resetE2EKey');

	const resetE2EEKey = useCallback(async () => {
		try {
			await resetE2EEKeyRequest({ userId });
			dispatchToastMessage({ type: 'success', message: t('Users_key_has_been_reset') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setModal();
		}
	}, [resetE2EEKeyRequest, setModal, t, userId, dispatchToastMessage]);

	const confirmResetE2EEKey = useCallback(() => {
		setModal(
			<GenericModal variant='danger' onConfirm={resetE2EEKey} onCancel={(): void => setModal()} confirmText={t('Reset')}>
				{t('E2E_Reset_Other_Key_Warning')}
			</GenericModal>,
		);
	}, [resetE2EEKey, t, setModal]);

	return canResetE2EEKey && enforcePassword
		? {
				icon: 'key',
				label: t('Reset_E2E_Key'),
				action: confirmResetE2EEKey,
		  }
		: undefined;
};
