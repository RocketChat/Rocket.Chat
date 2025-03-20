import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AuditLogTable from './components/AuditLogTable';
import { Page, PageHeader, PageContent } from '../../components/Page';

const AuditLogPage = (): ReactElement => {
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
