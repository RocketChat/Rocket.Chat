import { usePermission, useRouter, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

import GenericUpsellModal from '../../../../../client/components/GenericUpsellModal';
import PageSkeleton from '../../../../../client/components/PageSkeleton';
import { useIsEnterprise } from '../../../../../client/hooks/useIsEnterprise';
import NotAuthorizedPage from '../../../../../client/views/notAuthorized/NotAuthorizedPage';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import DeviceManagementAdminPage from './DeviceManagementAdminPage';

const DeviceManagementAdminRoute = (): ReactElement => {
	const t = useTranslation();
	const canViewDeviceManagement = usePermission('view-device-management');

	const { data } = useIsEnterprise();
	const hasDeviceManagement = useHasLicenseModule('device-management');
	const isUpsell = !data?.isEnterprise || !hasDeviceManagement;

	const router = useRouter();

	const setModal = useSetModal();
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleOpenModal = useCallback(() => {
		setModal(
			<GenericUpsellModal
				title={t('Device_Management')}
				img='images/device-management.png'
				subtitle={t('Ensure_secure_workspace_access')}
				description={t('Manage_which_devices')}
				onCloseEffect={() => setIsModalOpen(false)}
			/>,
		);
		setIsModalOpen(true);
	}, [setModal, t]);

	useEffect(() => {
		if (isUpsell) {
			handleOpenModal();
		}

		return () => {
			setModal(null);
		};
	}, [handleOpenModal, isUpsell, router, setModal]);

	if (isModalOpen) {
		return <PageSkeleton />;
	}

	if (!canViewDeviceManagement || !hasDeviceManagement) {
		return <NotAuthorizedPage />;
	}

	return <DeviceManagementAdminPage />;
};

export default DeviceManagementAdminRoute;
