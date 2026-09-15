import {
	useIsPrivilegedSettingsContext,
	usePermission,
	useRoute,
	useRouteParameter,
	useRouter,
	useSetting,
} from '@rocket.chat/ui-contexts';
import { memo, useEffect, useLayoutEffect } from 'react';

import StatusAndPresencePage from './StatusAndPresencePage';
import type { StatusAndPresenceTab } from './StatusAndPresenceTabs';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';

const TAB_ORDER = ['settings', 'custom-status', 'user-presence'] as const;

const StatusAndPresenceRoute = () => {
	const route = useRoute('user-status');
	const router = useRouter();
	const tab = useRouteParameter('tab');
	const context = useRouteParameter('context');
	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);

	const canManageCustomStatus = usePermission('manage-user-status');
	const canViewSettings = useIsPrivilegedSettingsContext();
	const { data: hasUnlimitedPresence } = useHasLicenseModule('unlimited-presence');
	const canManageUserPresence = usePermission('edit-other-user-info') && !!hasUnlimitedPresence;

	const allowed: Record<StatusAndPresenceTab, boolean> = {
		'settings': canViewSettings,
		'custom-status': canManageCustomStatus,
		'user-presence': canManageUserPresence,
	};

	const firstAllowedTab = TAB_ORDER.find((name) => allowed[name]);
	const currentTab = TAB_ORDER.find((name) => name === tab && allowed[name]);

	useLayoutEffect(() => {
		if (firstAllowedTab && !currentTab) {
			router.navigate({ name: 'user-status', params: { tab: firstAllowedTab } }, { replace: true });
		}
	}, [router, firstAllowedTab, currentTab]);

	useEffect(() => {
		if (presenceDisabled && currentTab && context !== 'presence-service') {
			route.push({ tab: currentTab, context: 'presence-service' });
		}
	}, [presenceDisabled, currentTab, context, route]);

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
