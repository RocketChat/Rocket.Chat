import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useAtLeastOnePermission, usePermission } from '@rocket.chat/ui-contexts';

import { AccountBox } from '../../../../../app/ui-utils/client';
import type { IAppAccountBoxItem, AccountBoxItem } from '../../../../../app/ui-utils/client/lib/AccountBox';
import { isAppAccountBoxItem } from '../../../../../app/ui-utils/client/lib/AccountBox';
import { useHasLicenseModule } from '../../../../../ee/client/hooks/useHasLicenseModule';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { useAdministrationItems } from './useAdministrationItems';
import { useAppsItems } from './useAppsItems';
import { useAuditItems } from './useAuditItems';

const ADMIN_PERMISSIONS = [
	'view-statistics',
	'run-import',
	'view-user-administration',
	'view-room-administration',
	'create-invite-links',
	'manage-cloud',
	'view-logs',
	'manage-sounds',
	'view-federation-data',
	'manage-email-inbox',
	'manage-emoji',
	'manage-outgoing-integrations',
	'manage-own-outgoing-integrations',
	'manage-incoming-integrations',
	'manage-own-incoming-integrations',
	'manage-oauth-apps',
	'access-mailer',
	'manage-user-status',
	'access-permissions',
	'access-setting-permissions',
	'view-privileged-setting',
	'edit-privileged-setting',
	'manage-selected-settings',
	'view-engagement-dashboard',
	'view-moderation-console',
];

export const useAdministrationMenu = () => {
	const getAccountBoxItems = useMutableCallback(() => AccountBox.getItems());
	const accountBoxItems = useReactiveValue(getAccountBoxItems);

	const hasAuditLicense = useHasLicenseModule('auditing') === true;
	const hasManageAppsPermission = usePermission('manage-apps');
	const hasAccessMarketplacePermission = usePermission('access-marketplace');
	const hasAdminPermission = useAtLeastOnePermission(ADMIN_PERMISSIONS);
	const hasAuditPermission = usePermission('can-audit') && hasAuditLicense;
	const hasAuditLogPermission = usePermission('can-audit-log') && hasAuditLicense;

	const appBoxItems = accountBoxItems.filter((item): item is IAppAccountBoxItem => isAppAccountBoxItem(item));
	const adminBoxItems = accountBoxItems.filter((item): item is AccountBoxItem => !isAppAccountBoxItem(item));

	const showAdmin = hasAdminPermission || !!adminBoxItems.length;
	const showAudit = hasAuditPermission || hasAuditLogPermission;
	const showWorkspace = hasAdminPermission;
	const showApps = hasAccessMarketplacePermission || hasManageAppsPermission || !!appBoxItems.length;

	const administrationItems = useAdministrationItems({ accountBoxItems: adminBoxItems, showWorkspace });
	const appItems = useAppsItems({
		appBoxItems,
		appsManagementAllowed: hasManageAppsPermission,
		showMarketplace: hasAccessMarketplacePermission || hasManageAppsPermission,
	});
	const auditItems = useAuditItems({ showAudit: hasAuditPermission, showAuditLog: hasAuditLogPermission });

	const sections = [
		{ title: 'Administration', items: administrationItems, permission: showAdmin },
		{ title: 'Apps', items: appItems, permission: showApps },
		{ title: 'Audit', items: auditItems, permission: showAudit },
	];

	return sections.filter(({ permission }) => permission);
};
