import { usePermission, useRoute, useSetModal, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

import PageSkeleton from '../../../../../client/components/PageSkeleton';
import UpsellModal from '../../../../../client/components/UpsellModal';
import { useIsEnterprise } from '../../../../../client/hooks/useIsEnterprise';
import NotAuthorizedPage from '../../../../../client/views/notAuthorized/NotAuthorizedPage';
import DeviceManagementAdminPage from './DeviceManagementAdminPage';

const DeviceManagementAdminRoute = (): ReactElement => {
	const t = useTranslation();

	const canViewDeviceManagement = usePermission('view-device-management');
	const deviceManagementRoute = useRoute('device-management');
	const cloudWorkspaceHadTrial = Boolean(useSetting('Cloud_Workspace_Had_Trial'));

	const { data } = useIsEnterprise();
	const setModal = useSetModal();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const handleModalClose = useCallback(() => {
		setModal(null);
		setIsModalOpen(false);
	}, [setModal]);

	const isUpsell = !data?.isEnterprise;
	const startFreeTrial = 'https://www.rocket.chat/trial-saas';
	const talkToSales = 'https://go.rocket.chat/i/contact-sales';

	useEffect(() => {
		if (isUpsell) {
			deviceManagementRoute.replace({ context: 'upsell' });
			setModal(
				<UpsellModal
					title={t('Device_Management')}
					img='images/Device-management.svg'
					subtitle={t('Ensure_secure_workspace_access')}
					description={t('Manage_which_devices')}
					confirmText={cloudWorkspaceHadTrial ? t('Learn_more') : t('Start_a_free_trial')}
					cancelText={t('Talk_to_an_expert')}
					onConfirm={() => window.open(startFreeTrial, '_blank')}
					onCancel={() => window.open(talkToSales, '_blank')}
					onClose={handleModalClose}
				/>,
			);
			setIsModalOpen(true);
		}
	}, [cloudWorkspaceHadTrial, deviceManagementRoute, handleModalClose, isUpsell, setModal, t]);

	if (isModalOpen) {
		return <PageSkeleton />;
	}

	if (!canViewDeviceManagement) {
		return <NotAuthorizedPage />;
	}

	return <DeviceManagementAdminPage />;
};

export default DeviceManagementAdminRoute;
