import { OptionDivider } from '@rocket.chat/fuselage';
import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { AccountBoxItem, IAppAccountBoxItem, isAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import { useHasLicenseModule } from '../../../ee/client/hooks/useHasLicenseModule';
import {
	ADMIN_PERMISSIONS,
	AUDIT_LICENSE_MODULE,
	AUDIT_PERMISSIONS,
	MANAGE_APPS_PERMISSIONS,
	SETTINGS_PERMISSIONS,
} from '../../sidebar/header/actions/constants';
import AdministrationModelList from './AdministrationModelList';
import AppsModelList from './AppsModelList';
import AuditModelList from './AuditModelList';
import SettingsModelList from './SettingsModelList';

type AdministrationListProps = {
	accountBoxItems: (IAppAccountBoxItem | AccountBoxItem)[];
	closeList: () => void;
};

const AdministrationList: FC<AdministrationListProps> = ({ accountBoxItems, closeList }) => {
	const appBoxItems = accountBoxItems.filter((item): item is IAppAccountBoxItem => isAppAccountBoxItem(item));
	const adminBoxItems = accountBoxItems.filter((item): item is AccountBoxItem => !isAppAccountBoxItem(item));

	const hasAuditLicense = useHasLicenseModule(AUDIT_LICENSE_MODULE) === true;
	const hasAuditPermission = useAtLeastOnePermission(AUDIT_PERMISSIONS) && hasAuditLicense;
	const hasAuditLogPermission = useAtLeastOnePermission(AUDIT_PERMISSIONS) && hasAuditLicense;
	const hasManageApps = useAtLeastOnePermission(MANAGE_APPS_PERMISSIONS);
	const hasAdminPermission = useAtLeastOnePermission(ADMIN_PERMISSIONS);
	const showSettings = useAtLeastOnePermission(SETTINGS_PERMISSIONS);
	const showAudit = hasAuditPermission && hasAuditLogPermission;
	const showManageApps = hasManageApps || !!appBoxItems.length;
	const showAdmin = hasAdminPermission || !!adminBoxItems.length;

	return (
		<>
			{showAdmin && <AdministrationModelList showAdmin={showAdmin} accountBoxItems={adminBoxItems} closeList={closeList} />}
			{showSettings && (
				<>
					<OptionDivider />
					<SettingsModelList closeList={closeList} />
				</>
			)}
			{showManageApps && (
				<>
					<OptionDivider />
					<AppsModelList appBoxItems={appBoxItems} closeList={closeList} showManageApps={showManageApps} />
				</>
			)}

			{showAudit && (
				<>
					<OptionDivider />
					<AuditModelList showAudit={hasAuditPermission} showAuditLog={hasAuditLogPermission} closeList={closeList} />
				</>
			)}
		</>
	);
};

export default AdministrationList;
