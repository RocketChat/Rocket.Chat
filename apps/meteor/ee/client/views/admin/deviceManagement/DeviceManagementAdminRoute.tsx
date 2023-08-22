import { usePermission, useRouter, useSetModal, useCurrentModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import GenericUpsellModal from '../../../../../client/components/GenericUpsellModal';
import { useUpsellActions } from '../../../../../client/components/GenericUpsellModal/hooks';
import PageSkeleton from '../../../../../client/components/PageSkeleton';
import NotAuthorizedPage from '../../../../../client/views/notAuthorized/NotAuthorizedPage';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import DeviceManagementAdminPage from './DeviceManagementAdminPage';

const DeviceManagementAdminRoute = (): ReactElement => {
	const t = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();
	const isModalOpen = useCurrentModal() !== null;

	const hasDeviceManagement = useHasLicenseModule('device-management') as boolean;
	const canViewDeviceManagement = usePermission('view-device-management');

	const { shouldShowUpsell, cloudWorkspaceHadTrial, handleGoFullyFeatured, handleTalkToSales } = useUpsellActions(hasDeviceManagement);

	useEffect(() => {
		if (shouldShowUpsell) {
			setModal(
				<GenericUpsellModal
					title={t('Device_Management')}
					img='images/device-management.png'
					subtitle={t('Ensure_secure_workspace_access')}
					description={t('Manage_which_devices')}
					cancelText={t('Talk_to_an_expert')}
					confirmText={cloudWorkspaceHadTrial ? t('Learn_more') : t('Start_a_free_trial')}
					onClose={() => setModal(null)}
					onConfirm={handleGoFullyFeatured}
					onCancel={handleTalkToSales}
				/>,
			);
		}
	}, [shouldShowUpsell, router, setModal, t, cloudWorkspaceHadTrial, handleGoFullyFeatured, handleTalkToSales]);

	if (isModalOpen) {
		return <PageSkeleton />;
	}

	if (!canViewDeviceManagement || !hasDeviceManagement) {
		return <NotAuthorizedPage />;
	}

	return <DeviceManagementAdminPage />;
};

export default DeviceManagementAdminRoute;
