import { OptionDivider } from '@rocket.chat/fuselage';
import { useAtLeastOnePermission, usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { Fragment } from 'react';

import type { AccountBoxItem, IAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import { isAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import { useHasLicenseModule } from '../../../ee/client/hooks/useHasLicenseModule';
import AdministrationModelList from './AdministrationModelList';
import AppsModelList from './AppsModelList';
import AuditModelList from './AuditModelList';

type AdministrationListProps = {
	accountBoxItems: (IAppAccountBoxItem | AccountBoxItem)[];
	onDismiss: () => void;
};

const ADMIN_PERMISSIONS = [
	'view-logs',
	'manage-emoji',
	'manage-sounds',
	'view-statistics',
	'manage-oauth-apps',
	'view-privileged-setting',
	'manage-selected-settings',
	'view-room-administration',
	'view-user-administration',
	'access-setting-permissions',
	'manage-outgoing-integrations',
	'manage-incoming-integrations',
	'manage-own-outgoing-integrations',
	'manage-own-incoming-integrations',
	'view-engagement-dashboard',
	'view-moderation-console',
];

const AdministrationList = ({ accountBoxItems, onDismiss }: AdministrationListProps): ReactElement => {
	const hasAuditLicense = useHasLicenseModule('auditing') === true;
	const hasAdminPermission = useAtLeastOnePermission(ADMIN_PERMISSIONS);
	const hasManageAppsPermission = usePermission('manage-apps');
	const hasAuditPermission = usePermission('can-audit') && hasAuditLicense;
	const hasAuditLogPermission = usePermission('can-audit-log') && hasAuditLicense;

	const appBoxItems = accountBoxItems.filter((item): item is IAppAccountBoxItem => isAppAccountBoxItem(item));
	const adminBoxItems = accountBoxItems.filter((item): item is AccountBoxItem => !isAppAccountBoxItem(item));
	const showAudit = hasAuditPermission || hasAuditLogPermission;
	const showAdmin = hasAdminPermission || !!adminBoxItems.length;
	const showWorkspace = hasAdminPermission;

	const list = [
		showAdmin && <AdministrationModelList showWorkspace={showWorkspace} accountBoxItems={adminBoxItems} onDismiss={onDismiss} />,
		<AppsModelList appBoxItems={appBoxItems} onDismiss={onDismiss} appsManagementAllowed={hasManageAppsPermission} />,
		showAudit && <AuditModelList showAudit={hasAuditPermission} showAuditLog={hasAuditLogPermission} onDismiss={onDismiss} />,
	];

	return (
		<>
			{list.filter(Boolean).map((item, index) => (
				<Fragment key={index}>
					{index > 0 && <OptionDivider />}
					{item}
				</Fragment>
			))}
		</>
	);
};

export default AdministrationList;
