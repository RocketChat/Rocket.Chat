import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { usePermission, useRouter, useTranslation } from '@rocket.chat/ui-contexts';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

export const useAuditMenu = () => {
	const router = useRouter();
	const t = useTranslation();

	const hasAuditLicense = useHasLicenseModule('auditing') === true;

	const hasAuditPermission = usePermission('can-audit') && hasAuditLicense;
	const hasAuditLogPermission = usePermission('can-audit-log') && hasAuditLicense;

	if (!hasAuditPermission && !hasAuditLogPermission) {
		return [];
	}

	const auditMessageItem: GenericMenuItemProps = {
		id: 'messages',
		icon: 'document-eye',
		content: t('Messages'),
		onClick: () => router.navigate('/audit'),
	};
	const auditLogItem: GenericMenuItemProps = {
		id: 'auditLog',
		icon: 'document-eye',
		content: t('Logs'),
		onClick: () => router.navigate('/audit-log'),
	};

	return [
		{
			title: t('Audit'),
			items: [hasAuditPermission && auditMessageItem, hasAuditLogPermission && auditLogItem].filter(Boolean) as GenericMenuItemProps[],
		},
	];
};
