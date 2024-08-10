import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { Page, PageHeader, PageContent } from '../../components/Page';
import AuditLogTable from './components/AuditLogTable';

const AuditLogPage = (): ReactElement => {
	const t = useTranslation();

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
