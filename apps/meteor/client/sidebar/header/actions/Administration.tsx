import { Sidebar, Dropdown } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import React, { HTMLAttributes, useRef, VFC } from 'react';
import { createPortal } from 'react-dom';

import { AccountBox } from '../../../../app/ui-utils/client';
import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import AdministrationList from '../../../components/AdministrationList/AdministrationList';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useDropdownVisibility } from '../hooks/useDropdownVisibility';
import {
	ADMIN_PERMISSIONS,
	AUDIT_LICENSE_MODULE,
	AUDIT_LOG_PERMISSIONS,
	AUDIT_PERMISSIONS,
	MANAGE_APPS_PERMISSIONS,
	SETTINGS_PERMISSIONS,
} from './constants';

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
	const hasSettingsPermission = useAtLeastOnePermission(SETTINGS_PERMISSIONS);
	const showMenu =
		hasAuditPermission || hasAuditLogPermission || hasManageApps || hasAdminPermission || hasSettingsPermission || !!accountBoxItems.length;

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
							hasSettingsPermission={hasSettingsPermission}
						/>
					</Dropdown>,
					document.body,
				)}
		</>
	);
};

export default Administration;
