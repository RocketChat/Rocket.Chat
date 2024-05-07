import { useTranslation, useRoute, usePermission } from '@rocket.chat/ui-contexts';

import { useHasLicenseModule } from '../../../../../ee/client/hooks/useHasLicenseModule';
import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';

/**
 * @deprecated Moved to NavBar
 * @description duplicated in apps/meteor/client/NavBar/actions/hooks/useAuditMenu.tsx until feature is ready
 * @memberof newNavigation
 */

export const useAuditItems = (): GenericMenuItemProps[] => {
	const hasAuditLicense = useHasLicenseModule('auditing') === true;

	const hasAuditPermission = usePermission('can-audit') && hasAuditLicense;
	const hasAuditLogPermission = usePermission('can-audit-log') && hasAuditLicense;

	const t = useTranslation();

	const auditHomeRoute = useRoute('audit-home');
	const auditSettingsRoute = useRoute('audit-log');

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

	return [hasAuditPermission && auditMessageItem, hasAuditLogPermission && auditLogItem].filter(Boolean) as GenericMenuItemProps[];
};
