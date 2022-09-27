import { OptionDivider } from '@rocket.chat/fuselage';
import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import React, { FC, Fragment } from 'react';

import { AccountBoxItem, IAppAccountBoxItem, isAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import { useHasLicenseModule } from '../../../ee/client/hooks/useHasLicenseModule';
import AdministrationModelList from './AdministrationModelList';
import AppsModelList from './AppsModelList';
import AuditModelList from './AuditModelList';
import SettingsModelList from './SettingsModelList';

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
];
const SETTINGS_PERMISSIONS = ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'];
const AUDIT_PERMISSIONS = ['can-audit'];
const AUDIT_LOG_PERMISSIONS = ['can-audit-log'];

const AUDIT_LICENSE_MODULE = 'auditing';

type AdministrationListProps = {
	accountBoxItems: (IAppAccountBoxItem | AccountBoxItem)[];
	closeList: () => void;
};

const AdministrationList: FC<AdministrationListProps> = ({ accountBoxItems, closeList }) => {
	const hasAuditLicense = useHasLicenseModule(AUDIT_LICENSE_MODULE) === true;
	const hasAuditPermission = useAtLeastOnePermission(AUDIT_PERMISSIONS) && hasAuditLicense;
	const hasAuditLogPermission = useAtLeastOnePermission(AUDIT_LOG_PERMISSIONS) && hasAuditLicense;
	const hasAdminPermission = useAtLeastOnePermission(ADMIN_PERMISSIONS);
	const hasSettingsPermission = useAtLeastOnePermission(SETTINGS_PERMISSIONS);

	const appBoxItems = accountBoxItems.filter((item): item is IAppAccountBoxItem => isAppAccountBoxItem(item));
	const adminBoxItems = accountBoxItems.filter((item): item is AccountBoxItem => !isAppAccountBoxItem(item));
	const showAudit = hasAuditPermission || hasAuditLogPermission;
	const showAdmin = hasAdminPermission || !!adminBoxItems.length;
	const showSettings = hasSettingsPermission;

	const list = [
		showAdmin && <AdministrationModelList showAdmin={showAdmin} accountBoxItems={adminBoxItems} closeList={closeList} />,
		showSettings && <SettingsModelList closeList={closeList} />,
		<AppsModelList appBoxItems={appBoxItems} closeList={closeList} />,
		showAudit && <AuditModelList showAudit={hasAuditPermission} showAuditLog={hasAuditLogPermission} closeList={closeList} />,
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
