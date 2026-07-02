import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useRoute, useRouteParameter, useEndpoint, UserContext } from '@rocket.chat/ui-contexts';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { deviceManagementQueryKeys } from '../lib/queryKeys';

export const useDeviceLogout = (
	sessionId: string,
	endpoint: '/v1/sessions/logout' | '/v1/sessions/logout.me',
	isCurrentSession?: boolean,
): (() => void) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const deviceManagementRouter = useRoute('device-management');
	const routeId = useRouteParameter('id');
	const { logout } = useContext(UserContext);

	const queryClient = useQueryClient();
	const logoutEndpoint = useEndpoint('POST', endpoint);

	const handleCloseContextualBar = useCallback(() => deviceManagementRouter.push({}), [deviceManagementRouter]);
	const isContextualBarOpen = routeId === sessionId;

	const { mutate: logoutDevice } = useMutation({
		mutationFn: logoutEndpoint,
		onSettled: () => {
			if (isCurrentSession) {
				setModal(null);
				logout();
			} else {
				queryClient.invalidateQueries({ queryKey: deviceManagementQueryKeys.all });
				if (isContextualBarOpen) {
					handleCloseContextualBar();
				}
				dispatchToastMessage({ type: 'success', message: t('Device_Logged_Out') });
				setModal(null);
			}
		},
		throwOnError: false,
	});

	return useCallback(() => {
		const closeModal = () => setModal(null);

		const handleLogoutDevice = () => {
			logoutDevice({ sessionId });
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
	}, [setModal, t, logoutDevice, sessionId]);
};
