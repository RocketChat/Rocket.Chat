import { Sidebar, Dropdown } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { usePermission, useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React, { useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

import { AccountBox } from '../../../../app/ui-utils/client';
import type { IAppAccountBoxItem, AccountBoxItem } from '../../../../app/ui-utils/client/lib/AccountBox';
import { isAppAccountBoxItem } from '../../../../app/ui-utils/client/lib/AccountBox';
import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import AdministrationList from '../../../components/AdministrationList/AdministrationList';
import AdministrationModelList from '../../../components/AdministrationList/AdministrationModelList';
import AppsModelList from '../../../components/AdministrationList/AppsModelList';
import AuditModelList from '../../../components/AdministrationList/AuditModelList';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useDropdownVisibility } from '../hooks/useDropdownVisibility';

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

const Administration: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const reference = useRef(null);
	const target = useRef(null);

	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

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

	const onDismiss = useCallback((): void => toggle(false), [toggle]);

	const optionsList = [
		showAdmin && <AdministrationModelList showWorkspace={showWorkspace} accountBoxItems={adminBoxItems} onDismiss={onDismiss} />,
		showApps && (
			<AppsModelList
				appBoxItems={appBoxItems}
				onDismiss={onDismiss}
				appsManagementAllowed={hasManageAppsPermission}
				showMarketplace={hasAccessMarketplacePermission || hasManageAppsPermission}
			/>
		),
		showAudit && <AuditModelList showAudit={hasAuditPermission} showAuditLog={hasAuditLogPermission} onDismiss={onDismiss} />,
	].filter(Boolean);

	if (!optionsList || optionsList.length === 0) {
		return null;
	}

	return (
		<>
			<Sidebar.TopBar.Action icon='menu' onClick={(): void => toggle()} {...props} ref={reference} />
			{isVisible &&
				createPortal(
					<Dropdown reference={reference} ref={target}>
						<AdministrationList optionsList={optionsList} />
					</Dropdown>,
					document.body,
				)}
		</>
	);
};

export default Administration;
