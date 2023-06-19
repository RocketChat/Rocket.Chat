import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';

import type { Item } from './useSortModeItems';

type useAuditItemsProps = {
	showAudit: boolean;
	showAuditLog: boolean;
};

export const useAuditItems = ({ showAudit, showAuditLog }: useAuditItemsProps): Item[] => {
	const t = useTranslation();

	const auditHomeRoute = useRoute('audit-home');
	const auditSettingsRoute = useRoute('audit-log');

	const auditMessageItem: Item = {
		id: 'messages',
		icon: 'document-eye',
		name: t('Messages'),
		onClick: () => auditHomeRoute.push(),
	};
	const auditLogItem: Item = {
		id: 'messages',
		icon: 'document-eye',
		name: t('Logs'),
		onClick: () => auditSettingsRoute.push(),
	};

	return [...(showAudit ? [auditMessageItem] : []), ...(showAuditLog ? [auditLogItem] : [])];
};
