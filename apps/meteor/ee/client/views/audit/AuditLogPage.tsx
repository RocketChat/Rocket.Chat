import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../../../client/components/Page';
import PageContent from '../../../../client/components/Page/PageContent';
import PageHeader from '../../../../client/components/Page/PageHeader';
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
