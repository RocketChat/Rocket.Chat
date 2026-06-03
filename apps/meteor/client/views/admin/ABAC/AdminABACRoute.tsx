import { usePermission, useSetModal, useCurrentModal, useRouter, useRouteParameter, useSettingStructure } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo, useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';

import AdminABACPage from './AdminABACPage';
import type { ABACTab } from './hooks/useABACTabPermissions';
import { ABAC_TAB_ORDER, useABACTabPermissions } from './hooks/useABACTabPermissions';
import ABACUpsellModal from '../../../components/ABAC/ABACUpsellModal/ABACUpsellModal';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';
import PageSkeleton from '../../../components/PageSkeleton';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import SettingsProvider from '../../../providers/SettingsProvider';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';

const AdminABACRoute = (): ReactElement => {
	const { t } = useTranslation();
	const canViewABACPage = usePermission('abac-management');
	const { data: hasABAC = false } = useHasLicenseModule('abac');
	const isModalOpen = !!useCurrentModal();
	const tab = useRouteParameter('tab');
	const router = useRouter();
	const tabPermissions = useABACTabPermissions();
	const firstAllowedTab = ABAC_TAB_ORDER.find((t) => tabPermissions[t]);
	const isAllowedTab = (ABAC_TAB_ORDER as readonly string[]).includes(tab ?? '') && tabPermissions[tab as ABACTab];

	const ABACEnabledSetting = useSettingStructure('ABAC_Enabled');

	useLayoutEffect(() => {
		if (firstAllowedTab && !isAllowedTab) {
			router.navigate(
				{
					name: 'admin-ABAC',
					params: { tab: firstAllowedTab },
				},
				{ replace: true },
			);
		}
	}, [router, firstAllowedTab, isAllowedTab]);

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

	if (!canViewABACPage || !firstAllowedTab || (ABACEnabledSetting === undefined && !hasABAC)) {
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
