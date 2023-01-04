import { OptionDivider } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { Fragment } from 'react';

import type { AccountBoxItem, IAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import { isAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import AdministrationModelList from './AdministrationModelList';
import AppsModelList from './AppsModelList';
import AuditModelList from './AuditModelList';

type AdministrationListProps = {
	accountBoxItems: (IAppAccountBoxItem | AccountBoxItem)[];
	onDismiss: () => void;
	hasAdminPermission: boolean;
	hasAuditLicense: boolean;
	hasAuditPermission: boolean;
	hasAuditLogPermission: boolean;
	hasManageApps: boolean;
};

const AdministrationList: FC<AdministrationListProps> = ({
	accountBoxItems,
	hasAuditPermission,
	hasAuditLogPermission,
	hasManageApps,
	hasAdminPermission,
	onDismiss,
}) => {
	const appBoxItems = accountBoxItems.filter((item): item is IAppAccountBoxItem => isAppAccountBoxItem(item));
	const adminBoxItems = accountBoxItems.filter((item): item is AccountBoxItem => !isAppAccountBoxItem(item));
	const showAudit = hasAuditPermission || hasAuditLogPermission;
	const showManageApps = hasManageApps || !!appBoxItems.length;
	const showAdmin = hasAdminPermission || !!adminBoxItems.length;
	const showWorkspace = hasAdminPermission;

	const list = [
		showAdmin && <AdministrationModelList showWorkspace={showWorkspace} accountBoxItems={adminBoxItems} onDismiss={onDismiss} />,
		showManageApps && <AppsModelList appBoxItems={appBoxItems} appsManagementAllowed={hasManageApps} onDismiss={onDismiss} />,
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
