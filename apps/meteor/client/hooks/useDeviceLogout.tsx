import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointMutation } from './useEndpointMutation';
import { deviceManagementQueryKeys } from '../lib/queryKeys';

export const useDeviceLogout = (sessionId: string, endpoint: '/v1/sessions/logout' | '/v1/sessions/logout.me'): (() => void) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const deviceManagementRouter = useRoute('device-management');
	const routeId = useRouteParameter('id');

	const queryClient = useQueryClient();

	const { mutateAsync: logoutDevice } = useEndpointMutation('POST', endpoint, {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: deviceManagementQueryKeys.all });
			isContextualBarOpen && handleCloseContextualBar();
			dispatchToastMessage({ type: 'success', message: t('Device_Logged_Out') });
		},
		onSettled: () => {
			setModal(null);
		},
	});

	const handleCloseContextualBar = useCallback(() => deviceManagementRouter.push({}), [deviceManagementRouter]);

	const isContextualBarOpen = routeId === sessionId;

	return useCallback(() => {
		const closeModal = () => setModal(null);

		const handleLogoutDevice = async () => {
			await logoutDevice({ sessionId });
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
