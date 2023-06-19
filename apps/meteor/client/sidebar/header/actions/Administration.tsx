import { MenuV2, MenuSection, MenuItem } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { usePermission, useAtLeastOnePermission, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, Key, VFC } from 'react';
import React from 'react';

import { AccountBox } from '../../../../app/ui-utils/client';
import type { IAppAccountBoxItem, AccountBoxItem } from '../../../../app/ui-utils/client/lib/AccountBox';
import { isAppAccountBoxItem } from '../../../../app/ui-utils/client/lib/AccountBox';
import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import GenericMenuContent from '../../../components/GenericMenuContent';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useAdministrationItems } from './hooks/useAdministrationItems';
import { useAppsItems } from './hooks/useAppsItems';
import { useAuditItems } from './hooks/useAuditItems';

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

const Administration: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = () => {
	const t = useTranslation();
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

	const menuItems = [...administrationItems, ...appItems, ...auditItems];

	const handleItemClick = useMutableCallback((id: Key) => {
		const item = menuItems.find((item) => item.id === id);
		item?.onClick && item.onClick();
	});

	return (
		<MenuV2 title={t('Administration')} onAction={handleItemClick}>
			{showAdmin &&
				((
					<MenuSection items={administrationItems} title={t('Administration')}>
						{(item) => (
							<MenuItem key={item.id}>
								<GenericMenuContent item={item} />
							</MenuItem>
						)}
					</MenuSection>
				) as any)}
			{showApps &&
				((
					<MenuSection items={appItems} title={t('Apps')}>
						{(item) => (
							<MenuItem key={item.id}>
								<GenericMenuContent item={item} />
							</MenuItem>
						)}
					</MenuSection>
				) as any)}
			{showAudit &&
				((
					<MenuSection items={auditItems} title={t('Audit')}>
						{(item) => (
							<MenuItem key={item.id}>
								<GenericMenuContent item={item} />
							</MenuItem>
						)}
					</MenuSection>
				) as any)}
		</MenuV2>
	);
};

export default Administration;
