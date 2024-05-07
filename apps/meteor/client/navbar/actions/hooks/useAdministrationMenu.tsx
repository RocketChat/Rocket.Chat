import { usePermission, useRouter, useTranslation } from '@rocket.chat/ui-contexts';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import type { GenericMenuItemProps } from '../../../components/GenericMenu/GenericMenuItem';

export const useAdministrationMenu = () => {
	const router = useRouter();
	const t = useTranslation();

	const hasAuditLicense = useHasLicenseModule('auditing') === true;

	const hasAuditPermission = usePermission('can-audit') && hasAuditLicense;
	const hasAuditLogPermission = usePermission('can-audit-log') && hasAuditLicense;

	if (!hasAuditPermission && !hasAuditLogPermission) {
		return [];
	}

	const auditMessageItem: GenericMenuItemProps = {
		id: 'workspace',
		icon: 'extended-view',
		content: t('Workspace'),
		onClick: () => router.navigate('/admin'),
	};
	const auditLogItem: GenericMenuItemProps = {
		id: 'omnichannel',
		icon: 'headset',
		content: t('Omnichannel'),
		onClick: () => router.navigate('/omnichannel/current'),
	};

	return [
		{
			title: t('Administration'),
			items: [hasAuditPermission && auditMessageItem, hasAuditLogPermission && auditLogItem].filter(Boolean) as GenericMenuItemProps[],
		},
	];
};
