import { useSetModal, useTranslation, useToastMessageDispatch, useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo } from 'react';

import GenericModal from '../../../client/components/GenericModal';
import { useEndpointAction } from '../../../client/hooks/useEndpointAction';

export const useDeviceLogout = (
	sessionId: string,
	endpoint: '/v1/sessions/logout' | '/v1/sessions/logout.me',
): ((onReload: () => void) => void) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const deviceManagementRouter = useRoute('device-management');
	const routeId = useRouteParameter('id');

	const logoutDevice = useEndpointAction(
		'POST',
		endpoint,
		useMemo(() => ({ sessionId }), [sessionId]),
	);

	const handleCloseContextualBar = useCallback((): void => deviceManagementRouter.push({}), [deviceManagementRouter]);

	const isContextualBarOpen = routeId === sessionId;

	const handleLogoutDeviceModal = useCallback(
		(onReload: () => void) => {
			const closeModal = (): void => setModal(null);

			const handleLogoutDevice = async (): Promise<void> => {
				try {
					await logoutDevice();
					onReload();
					isContextualBarOpen && handleCloseContextualBar();
					dispatchToastMessage({ type: 'success', message: t('Device_Logged_Out') });
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
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
		[t, logoutDevice, setModal, dispatchToastMessage, handleCloseContextualBar, isContextualBarOpen],
	);

	return handleLogoutDeviceModal;
};
