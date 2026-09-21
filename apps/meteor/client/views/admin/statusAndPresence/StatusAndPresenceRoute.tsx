import {
	useIsPrivilegedSettingsContext,
	usePermission,
	useRouteParameter,
	useRouter,
	useSetting,
	useSettings,
} from '@rocket.chat/ui-contexts';
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { STATUS_SETTING_IDS } from './SettingsTab';
import StatusAndPresencePage from './StatusAndPresencePage';
import type { StatusAndPresenceTab } from './StatusAndPresenceTabs';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';

const TAB_ORDER = ['settings', 'custom-status', 'user-presence'] as const;

const statusSettingsQuery = { _id: STATUS_SETTING_IDS };

const StatusAndPresenceRoute = () => {
	const router = useRouter();
	const tab = useRouteParameter('tab');
	const context = useRouteParameter('context');
	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);
	const presenceServiceOpened = useRef(false);

	const canManageCustomStatus = usePermission('manage-user-status');
	const hasPrivateSettings = useIsPrivilegedSettingsContext();
	const statusSettings = useSettings(statusSettingsQuery);
	const adminStatusHidingEnabled = useSetting('Accounts_StatusVisibility_Admin_Enabled', false);
	const canEditOtherUserInfo = usePermission('edit-other-user-info');
	const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');
	const canManageUserPresence = canEditOtherUserInfo && canViewFullOtherUserInfo && adminStatusHidingEnabled;

	const settingIds = useMemo(
		() => (hasPrivateSettings ? STATUS_SETTING_IDS.filter((id) => statusSettings.some((setting) => setting._id === id)) : []),
		[hasPrivateSettings, statusSettings],
	);

	const allowed: Record<StatusAndPresenceTab, boolean> = {
		'settings': settingIds.length > 0,
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
		if (!presenceDisabled) {
			presenceServiceOpened.current = false;
			return;
		}

		if (presenceServiceOpened.current || !canManageCustomStatus || !currentTab) {
			return;
		}

		presenceServiceOpened.current = true;

		if (context !== 'presence-service') {
			router.navigate({ name: 'user-status', params: { tab: currentTab, context: 'presence-service' } }, { replace: true });
		}
	}, [presenceDisabled, canManageCustomStatus, currentTab, context, router]);

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
				settingIds={settingIds}
			/>
		</EditableSettingsProvider>
	);
};

export default memo(StatusAndPresenceRoute);
