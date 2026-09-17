import { useIsPrivilegedSettingsContext, usePermission, useRouteParameter, useRouter, useSetting } from '@rocket.chat/ui-contexts';
import { memo, useEffect, useLayoutEffect } from 'react';

import StatusAndPresencePage from './StatusAndPresencePage';
import type { StatusAndPresenceTab } from './StatusAndPresenceTabs';
import PageSkeleton from '../../../components/PageSkeleton';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';

const TAB_ORDER = ['settings', 'custom-status', 'user-presence'] as const;

const StatusAndPresenceRoute = () => {
	const router = useRouter();
	const tab = useRouteParameter('tab');
	const context = useRouteParameter('context');
	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);

	const canManageCustomStatus = usePermission('manage-user-status');
	const canViewSettings = useIsPrivilegedSettingsContext();
	const { data: hasUnlimitedPresence, isPending: isLicensePending } = useHasLicenseModule('unlimited-presence');
	const canManageUserPresence = usePermission('edit-other-user-info') && !!hasUnlimitedPresence;

	const allowed: Record<StatusAndPresenceTab, boolean> = {
		'settings': canViewSettings,
		'custom-status': canManageCustomStatus,
		'user-presence': canManageUserPresence,
	};

	const firstAllowedTab = TAB_ORDER.find((name) => allowed[name]);
	const currentTab = TAB_ORDER.find((name) => name === tab && allowed[name]);

	useLayoutEffect(() => {
		if (isLicensePending) {
			return;
		}

		if (firstAllowedTab && !currentTab) {
			router.navigate({ name: 'user-status', params: { tab: firstAllowedTab } }, { replace: true });
		}
	}, [router, firstAllowedTab, currentTab, isLicensePending]);

	useEffect(() => {
		if (presenceDisabled && canManageCustomStatus && currentTab && context !== 'presence-service') {
			router.navigate({ name: 'user-status', params: { tab: currentTab, context: 'presence-service' } });
		}
	}, [presenceDisabled, canManageCustomStatus, currentTab, context, router]);

	if (isLicensePending) {
		return <PageSkeleton />;
	}

	if (!firstAllowedTab) {
		return <NotAuthorizedPage />;
	}

	if (!currentTab) {
		return null;
	}

	return (
		<EditableSettingsProvider>
			<StatusAndPresencePage
				tab={currentTab}
				canManageCustomStatus={canManageCustomStatus}
				canManageUserPresence={canManageUserPresence}
				canViewSettings={canViewSettings}
			/>
		</EditableSettingsProvider>
	);
};

export default memo(StatusAndPresenceRoute);
