import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { Suspense, useEffect } from 'react';

import { ADMIN_PERMISSIONS } from '../../components/AdministrationList/AdministrationList';
import PageSkeleton from '../../components/PageSkeleton';
import { useDefaultRoute } from '../../hooks/useDefaultRoute';
import SettingsProvider from '../../providers/SettingsProvider';
import { useUpgradeTabParams } from '../hooks/useUpgradeTabParams';
import AdministrationLayout from './AdministrationLayout';

type AdministrationRouterProps = {
	children?: ReactNode;
};

const AdministrationRouter = ({ children }: AdministrationRouterProps): ReactElement => {
	const { tabType, trialEndDate, isLoading } = useUpgradeTabParams();
	const [routeName] = useCurrentRoute();

	const info = useRoute('admin-info');
	const runImport = useRoute('admin-import');
	const users = useRoute('admin-users');
	const rooms = useRoute('admin-rooms');
	const invites = useRoute('invites');
	const cloud = useRoute('cloud');
	const viewLogs = useRoute('admin-view-logs');
	const customSounds = useRoute('custom-sounds');
	const federationDashboard = useRoute('federation-dashboard');
	const emailInboxes = useRoute('admin-email-inboxes');
	const emojiCustom = useRoute('emoji-custom');
	const integrations = useRoute('admin-integrations');
	const oAuthApps = useRoute('admin-oauth-apps');
	const mailer = useRoute('admin-mailer');
	const userStatus = useRoute('user-status');
	const permissions = useRoute('admin-permissions');
	const settings = useRoute('admin-settings');
	const engagementDashboard = useRoute('engagement-dashboard');

	const ADMIN_ROUTES: Record<string, ReturnType<typeof useRoute>> = {
		'view-statistics': info,
		'run-import': runImport,
		'view-user-administration': users,
		'view-room-administration': rooms,
		'create-invite-links': invites,
		'manage-cloud': cloud,
		'view-logs': viewLogs,
		'manage-sounds': customSounds,
		'view-federation-data': federationDashboard,
		'manage-email-inbox': emailInboxes,
		'manage-emoji': emojiCustom,
		'manage-outgoing-integrations': integrations,
		'manage-own-outgoing-integrations': integrations,
		'manage-incoming-integrations': integrations,
		'manage-own-incoming-integrations': integrations,
		'manage-oauth-apps': oAuthApps,
		'access-mailer': mailer,
		'manage-user-status': userStatus,
		'access-permissions': permissions,
		'access-setting-permissions': settings,
		'view-privileged-setting': settings,
		'edit-privileged-setting': settings,
		'manage-selected-settings': settings,
		'view-engagement-dashboard': engagementDashboard,
	};

	const defaultRoute = useDefaultRoute(ADMIN_ROUTES, ADMIN_PERMISSIONS, info);
	const upgradeRoute = useRoute('upgrade');

	useEffect(() => {
		if (isLoading || routeName !== 'admin-index') {
			return;
		}

		if (tabType) {
			upgradeRoute.replace({ type: tabType }, trialEndDate ? { trialEndDate } : undefined);
			return;
		}

		defaultRoute.replace();
	}, [defaultRoute, upgradeRoute, routeName, tabType, trialEndDate, isLoading]);

	return (
		<AdministrationLayout>
			<SettingsProvider privileged>
				{children ? <Suspense fallback={<PageSkeleton />}>{children}</Suspense> : <PageSkeleton />}
			</SettingsProvider>
		</AdministrationLayout>
	);
};

export default AdministrationRouter;
