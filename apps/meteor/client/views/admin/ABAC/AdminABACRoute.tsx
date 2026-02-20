import { usePermission, useSetModal, useCurrentModal, useRouter, useRouteParameter, useSettingStructure } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo, useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';

import AdminABACPage from './AdminABACPage';
import ABACUpsellModal from '../../../components/ABAC/ABACUpsellModal/ABACUpsellModal';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';
import PageSkeleton from '../../../components/PageSkeleton';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import SettingsProvider from '../../../providers/SettingsProvider';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';

const AdminABACRoute = (): ReactElement => {
	const { t } = useTranslation();
	// TODO: Check what permission is needed to view the ABAC page
	const canViewABACPage = usePermission('abac-management');
	const { data: hasABAC = false } = useHasLicenseModule('abac');
	const isModalOpen = !!useCurrentModal();
	const tab = useRouteParameter('tab');
	const router = useRouter();

	// Check if setting exists in the DB to decide if we show warning or upsell
	const ABACEnabledSetting = useSettingStructure('ABAC_Enabled');

	useLayoutEffect(() => {
		if (!tab) {
			router.navigate({
				name: 'admin-ABAC',
				params: { tab: 'settings' },
			});
		}
	}, [tab, router]);

	const { shouldShowUpsell, handleManageSubscription } = useUpsellActions(hasABAC);

	const setModal = useSetModal();

	useEffect(() => {
		// WS has never activated ABAC
		if (shouldShowUpsell && ABACEnabledSetting === undefined) {
			setModal(<ABACUpsellModal onClose={() => setModal(null)} onConfirm={handleManageSubscription} />);
		}
	}, [shouldShowUpsell, setModal, t, handleManageSubscription, ABACEnabledSetting]);

	if (isModalOpen) {
		return <PageSkeleton />;
	}

	if (!canViewABACPage || (ABACEnabledSetting === undefined && !hasABAC)) {
		return <NotAuthorizedPage />;
	}

	return (
		<SettingsProvider>
			<EditableSettingsProvider>
				<AdminABACPage shouldShowWarning={ABACEnabledSetting !== undefined && !hasABAC} />
			</EditableSettingsProvider>
		</SettingsProvider>
	);
};

export default memo(AdminABACRoute);
