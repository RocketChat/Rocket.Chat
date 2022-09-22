import { OptionDivider } from '@rocket.chat/fuselage';
import React, { FC, Fragment } from 'react';

import { AccountBoxItem, IAppAccountBoxItem, isAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import AdministrationModelList from './AdministrationModelList';
import AppsModelList from './AppsModelList';
import AuditModelList from './AuditModelList';
import SettingsModelList from './SettingsModelList';

type AdministrationListProps = {
	accountBoxItems: (IAppAccountBoxItem | AccountBoxItem)[];
	closeList: () => void;
	hasAdminPermission: boolean;
	hasAuditLicense: boolean;
	hasAuditPermission: boolean;
	hasAuditLogPermission: boolean;
	hasManageApps: boolean;
	hasSettingsPermission: boolean;
};

const AdministrationList: FC<AdministrationListProps> = ({
	accountBoxItems,
	hasAuditPermission,
	hasAuditLogPermission,
	hasManageApps,
	hasSettingsPermission,
	hasAdminPermission,
	closeList,
}) => {
	const appBoxItems = accountBoxItems.filter((item): item is IAppAccountBoxItem => isAppAccountBoxItem(item));
	const adminBoxItems = accountBoxItems.filter((item): item is AccountBoxItem => !isAppAccountBoxItem(item));
	const showAudit = hasAuditPermission || hasAuditLogPermission;
	const showManageApps = hasManageApps || !!appBoxItems.length;
	const showAdmin = hasAdminPermission || !!adminBoxItems.length;
	const showSettings = hasSettingsPermission;

	const list = [
		showAdmin && <AdministrationModelList showAdmin={showAdmin} accountBoxItems={adminBoxItems} closeList={closeList} />,
		showSettings && <SettingsModelList closeList={closeList} />,
		showManageApps && <AppsModelList appBoxItems={appBoxItems} closeList={closeList} showManageApps={showManageApps} />,
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
