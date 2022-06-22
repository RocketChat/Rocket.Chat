import { useSetModal, useTranslation, useToastMessageDispatch, useRoute } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo } from 'react';

import GenericModal from '../../../client/components/GenericModal';
import { useEndpointAction } from '../../../client/hooks/useEndpointAction';

const useDeviceLogout = (sessionId: string): ((onReload: () => void, closeContextualBar?: boolean) => void) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const deviceManagementRouter = useRoute('device-management');

	const logoutDevice = useEndpointAction(
		'POST',
		'/v1/sessions/logout',
		useMemo(() => ({ sessionId }), [sessionId]),
	);

	const handleCloseContextualBar = useCallback((): void => deviceManagementRouter.push({}), [deviceManagementRouter]);

	const handleLogoutDeviceModal = useCallback(
		(onReload: () => void, closeContextualBar = false) => {
			const closeModal = (): void => setModal(null);

			const handleLogoutDevice = async (): Promise<void> => {
				try {
					await logoutDevice();
					onReload();
					closeContextualBar && handleCloseContextualBar();
					dispatchToastMessage({ type: 'success', message: t('Device_Logged_Out') });
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: String(error) });
				} finally {
					closeModal();
				}
			};

			setModal(
				<GenericModal
					title={t('Logout_Device')}
					variant='danger'
					confirmText={t('Logout_Device')}
					cancelText={t('Cancel')}
					onConfirm={handleLogoutDevice}
					onCancel={closeModal}
					onClose={closeModal}
				>
					{t('Device_Logout_Text')}
				</GenericModal>,
			);
		},
		[t, logoutDevice, setModal, dispatchToastMessage, handleCloseContextualBar],
	);

	return handleLogoutDeviceModal;
};

export default useDeviceLogout;
