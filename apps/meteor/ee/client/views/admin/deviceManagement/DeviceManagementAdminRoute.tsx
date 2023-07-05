import { usePermission, useRoute, useSetModal, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

import PageSkeleton from '../../../../../client/components/PageSkeleton';
import UpsellModal from '../../../../../client/components/UpsellModal';
import { useIsEnterprise } from '../../../../../client/hooks/useIsEnterprise';
import NotAuthorizedPage from '../../../../../client/views/notAuthorized/NotAuthorizedPage';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import DeviceManagementAdminPage from './DeviceManagementAdminPage';

const DeviceManagementAdminRoute = (): ReactElement => {
	const t = useTranslation();
	const canViewDeviceManagement = usePermission('view-device-management');
	const cloudWorkspaceHadTrial = Boolean(useSetting('Cloud_Workspace_Had_Trial'));

	const { data } = useIsEnterprise();
	const hasDeviceManagement = useHasLicenseModule('engagement-dashboard');
	const isUpsell = !data?.isEnterprise || !hasDeviceManagement;

	const deviceManagementRoute = useRoute('device-management');
	const upgradeRoute = useRoute('upgrade');

	const setModal = useSetModal();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const handleModalClose = useCallback(() => {
		setModal(null);
		setIsModalOpen(false);
	}, [setModal]);

	const handleConfirmModal = useCallback(() => {
		handleModalClose();
		upgradeRoute.push({ type: 'go-fully-featured-registered' });
	}, [handleModalClose, upgradeRoute]);

	const talkToSales = 'https://go.rocket.chat/i/contact-sales';
	const handleCancelModal = useCallback(() => {
		handleModalClose();
		window.open(talkToSales, '_blank');
	}, [handleModalClose]);

	const handleOpenModal = useCallback(() => {
		deviceManagementRoute.replace({ context: 'upsell' });
		setModal(
			<UpsellModal
				title={t('Device_Management')}
				img='images/device-management.png'
				subtitle={t('Ensure_secure_workspace_access')}
				description={t('Manage_which_devices')}
				confirmText={cloudWorkspaceHadTrial ? t('Learn_more') : t('Start_a_free_trial')}
				cancelText={t('Talk_to_an_expert')}
				onConfirm={handleConfirmModal}
				onCancel={handleCancelModal}
				onClose={handleModalClose}
			/>,
		);
		setIsModalOpen(true);
	}, [cloudWorkspaceHadTrial, deviceManagementRoute, handleCancelModal, handleConfirmModal, handleModalClose, setModal, t]);

	useEffect(() => {
		if (isUpsell) {
			handleOpenModal();
		}

		return () => {
			handleModalClose();
		};
	}, [handleModalClose, handleOpenModal, isUpsell]);

	if (isModalOpen) {
		return <PageSkeleton />;
	}

	if (!canViewDeviceManagement || !hasDeviceManagement) {
		return <NotAuthorizedPage />;
	}

	return <DeviceManagementAdminPage />;
};

export default DeviceManagementAdminRoute;
