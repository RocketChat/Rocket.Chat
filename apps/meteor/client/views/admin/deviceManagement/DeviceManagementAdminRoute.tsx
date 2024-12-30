import { usePermission, useRouter, useSetModal, useCurrentModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import DeviceManagementAdminPage from './DeviceManagementAdminPage';
import { getURL } from '../../../../app/utils/client/getURL';
import GenericUpsellModal from '../../../components/GenericUpsellModal';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';
import PageSkeleton from '../../../components/PageSkeleton';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const DeviceManagementAdminRoute = (): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();
	const isModalOpen = !!useCurrentModal();

	const hasDeviceManagement = useHasLicenseModule('device-management') as boolean;
	const canViewDeviceManagement = usePermission('view-device-management');

	const { shouldShowUpsell, handleManageSubscription } = useUpsellActions(hasDeviceManagement);

	useEffect(() => {
		if (shouldShowUpsell) {
			setModal(
				<GenericUpsellModal
					aria-label={t('Device_Management')}
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
