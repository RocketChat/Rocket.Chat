import { useTranslation, usePermission, useRouter } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

import { useHasLicenseModule } from '../../../ee/client/hooks/useHasLicenseModule';
import GenericMenu from '../../components/GenericMenu/GenericMenu';
import { useHandleMenuAction } from '../../components/GenericMenu/hooks/useHandleMenuAction';
import { NavbarAction } from '../../components/Navbar';

const NavbarAuditAction = (props: AllHTMLAttributes<HTMLLIElement>) => {
	const t = useTranslation();
	const hasAuditLicense = useHasLicenseModule('auditing') === true;
	const hasAuditPermission = usePermission('can-audit') && hasAuditLicense;
	const hasAuditLogPermission = usePermission('can-audit-log') && hasAuditLicense;
	const showAudit = hasAuditPermission || hasAuditLogPermission;
	const router = useRouter();

	const auditMessageItem = {
		id: 'auditMessages',
		content: t('Messages'),
		onClick: () => router.navigate('/audit'),
	};

	const auditLogItem = {
		id: 'auditLog',
		content: t('Logs'),
		onClick: () => router.navigate('/audit-log'),
	};

	const auditItems = [...(showAudit ? [auditMessageItem] : []), ...(hasAuditLogPermission ? [auditLogItem] : [])];
	const handleAction = useHandleMenuAction(auditItems);

	return (
		<NavbarAction {...props}>
			<GenericMenu medium title={t('Audit')} icon='document-eye' onAction={handleAction} items={auditItems} />
		</NavbarAction>
	);
};

export default NavbarAuditAction;
