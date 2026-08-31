import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AuditLogTable from './components/AuditLogTable';

const AuditLogPage = () => {
	const { t } = useTranslation();

	return (
		<Page>
			<PageHeader title={t('Message_auditing_log')} />
			<PageContent>
				<AuditLogTable />
			</PageContent>
		</Page>
	);
};

export default AuditLogPage;
