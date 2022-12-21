import { Sidebar, Dropdown } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React, { useRef } from 'react';
import { createPortal } from 'react-dom';

import { AccountBox } from '../../../../app/ui-utils/client';
import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import AdministrationList from '../../../components/AdministrationList/AdministrationList';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useDropdownVisibility } from '../hooks/useDropdownVisibility';

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
const AUDIT_PERMISSIONS = ['can-audit'];
const AUDIT_LOG_PERMISSIONS = ['can-audit-log'];
const MANAGE_APPS_PERMISSIONS = ['manage-apps'];

const AUDIT_LICENSE_MODULE = 'auditing';

const Administration: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const reference = useRef(null);
	const target = useRef(null);

	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	const getAccountBoxItems = useMutableCallback(() => AccountBox.getItems());
	const accountBoxItems = useReactiveValue(getAccountBoxItems);

	const hasAuditLicense = useHasLicenseModule(AUDIT_LICENSE_MODULE) === true;
	const hasAuditPermission = useAtLeastOnePermission(AUDIT_PERMISSIONS) && hasAuditLicense;
	const hasAuditLogPermission = useAtLeastOnePermission(AUDIT_LOG_PERMISSIONS) && hasAuditLicense;
	const hasManageApps = useAtLeastOnePermission(MANAGE_APPS_PERMISSIONS);
	const hasAdminPermission = useAtLeastOnePermission(ADMIN_PERMISSIONS);
	const showMenu = hasAuditPermission || hasAuditLogPermission || hasManageApps || hasAdminPermission || !!accountBoxItems.length;

	return (
		<>
			{showMenu && <Sidebar.TopBar.Action icon='menu' onClick={(): void => toggle()} {...props} ref={reference} />}
			{isVisible &&
				createPortal(
					<Dropdown reference={reference} ref={target}>
						<AdministrationList
							accountBoxItems={accountBoxItems}
							closeList={(): void => toggle(false)}
							hasAdminPermission={hasAdminPermission}
							hasAuditLicense={hasAuditLicense}
							hasAuditPermission={hasAuditPermission}
							hasAuditLogPermission={hasAuditLogPermission}
							hasManageApps={hasManageApps}
						/>
					</Dropdown>,
					document.body,
				)}
		</>
	);
};

export default Administration;
