import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';

import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';

type useAuditItemsProps = {
	showAudit: boolean;
	showAuditLog: boolean;
};

export const useAuditItems = ({ showAudit, showAuditLog }: useAuditItemsProps): GenericMenuItemProps[] => {
	const t = useTranslation();

	const auditHomeRoute = useRoute('audit-home');
	const auditSettingsRoute = useRoute('audit-log');

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

	return [...(showAudit ? [auditMessageItem] : []), ...(showAuditLog ? [auditLogItem] : [])];
};
