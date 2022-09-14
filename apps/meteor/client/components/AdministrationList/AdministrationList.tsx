import { OptionDivider } from '@rocket.chat/fuselage';
import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { AccountBoxItem, IAppAccountBoxItem, isAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import { useHasLicenseModule } from '../../../ee/client/hooks/useHasLicenseModule';
import {
	ADMIN_PERMISSIONS,
	AUDIT_LICENSE_MODULE,
	AUDIT_MENU_PERMISSIONS,
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

	const hasAuditLicense = useHasLicenseModule(AUDIT_LICENSE_MODULE);
	const showAudit = useAtLeastOnePermission(AUDIT_MENU_PERMISSIONS) && hasAuditLicense;
	const showManageApps = useAtLeastOnePermission(MANAGE_APPS_PERMISSIONS) || !!appBoxItems.length;
	const showAdmin = useAtLeastOnePermission(ADMIN_PERMISSIONS) || !!adminBoxItems.length;
	const showSettings = useAtLeastOnePermission(SETTINGS_PERMISSIONS);

	return (
		<>
			{showAdmin && <AdministrationModelList accountBoxItems={adminBoxItems} closeList={closeList} />}
			{showSettings && (
				<>
					<OptionDivider />
					<SettingsModelList closeList={closeList} />
				</>
			)}
			{showManageApps && (
				<>
					<OptionDivider />
					<AppsModelList appBoxItems={appBoxItems} closeList={closeList} />
				</>
			)}

			{showAudit && (
				<>
					<OptionDivider />
					<AuditModelList closeList={closeList} />
				</>
			)}
		</>
	);
};

export default AdministrationList;
