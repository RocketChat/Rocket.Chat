import type { IUser } from '@rocket.chat/core-typings';
import { useSetModal, usePermission, useEndpoint, useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import type { AdminUserAction } from './useAdminUserInfoActions';
import GenericModal from '../../../../components/GenericModal';

export const useResetE2EEKeyAction = (userId: IUser['_id']): AdminUserAction | undefined => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const canResetE2EEKey = usePermission('edit-other-user-e2ee');
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

	return canResetE2EEKey
		? {
				icon: 'key',
				content: t('Reset_E2E_Key'),
				onClick: confirmResetE2EEKey,
			}
		: undefined;
};
