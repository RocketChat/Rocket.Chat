import { usePermission, useRouter, useSetModal, useCurrentModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import { getURL } from '../../../../app/utils/client/getURL';
import GenericUpsellModal from '../../../components/GenericUpsellModal';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';
import PageSkeleton from '../../../components/PageSkeleton';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import DeviceManagementAdminPage from './DeviceManagementAdminPage';

const DeviceManagementAdminRoute = (): ReactElement => {
	const t = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();
	const isModalOpen = useCurrentModal() !== null;

	const hasDeviceManagement = useHasLicenseModule('device-management') as boolean;
	const canViewDeviceManagement = usePermission('view-device-management');

	const { shouldShowUpsell, handleManageSubscription } = useUpsellActions(hasDeviceManagement);

	useEffect(() => {
		if (shouldShowUpsell) {
			setModal(
				<GenericUpsellModal
					title={t('Device_Management')}
					img={getURL('images/device-management.png')}
					subtitle={t('Ensure_secure_workspace_access')}
					description={t('Manage_which_devices')}
					onClose={() => setModal(null)}
					onConfirm={handleManageSubscription}
					onCancel={() => setModal(null)}
				/>,
			);
		}
	}, [shouldShowUpsell, router, setModal, t, handleManageSubscription]);

	if (isModalOpen) {
		return <PageSkeleton />;
	}

	if (!canViewDeviceManagement || !hasDeviceManagement) {
		return <NotAuthorizedPage />;
	}

	return <DeviceManagementAdminPage />;
};

export default DeviceManagementAdminRoute;
