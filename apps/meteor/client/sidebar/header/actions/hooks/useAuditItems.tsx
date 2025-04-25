import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation, useRoute, usePermission } from '@rocket.chat/ui-contexts';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';

export const useAuditItems = (): GenericMenuItemProps[] => {
	const hasAuditLicense = useHasLicenseModule('auditing') === true;

	const hasAuditPermission = usePermission('can-audit') && hasAuditLicense;
	const hasAuditLogPermission = usePermission('can-audit-log') && hasAuditLicense;

	const t = useTranslation();

	const auditHomeRoute = useRoute('audit-home');
	const auditSettingsRoute = useRoute('audit-log');
	const securityLogsRoute = useRoute('security-logs');

	if (!hasAuditPermission && !hasAuditLogPermission) {
		return [];
	}

	const auditMessageItem: GenericMenuItemProps = {
		id: 'messages',
		icon: 'document-eye',
		content: t('Messages'),
		onClick: () => auditHomeRoute.push(),
	};
	const auditLogItem: GenericMenuItemProps = {
		id: 'auditLog',
		icon: 'document-eye',
		content: t('Logs'),
		onClick: () => auditSettingsRoute.push(),
	};

	const securityLogItem: GenericMenuItemProps = {
		id: 'securityLog',
		icon: 'document-eye',
		content: t('Security_logs'),
		onClick: () => securityLogsRoute.push(),
	};

	return [hasAuditPermission && auditMessageItem, hasAuditLogPermission && auditLogItem, hasAuditLogPermission && securityLogItem].filter(
		Boolean,
	) as GenericMenuItemProps[];
};
