import { Field } from '@rocket.chat/fuselage';
import { useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useState } from 'react';

import Page from '../../../client/components/Page';
import AuditLogTable from './AuditLogTable';
import DateRangePicker from './DateRangePicker';

const AuditLogPage = (): ReactElement => {
	const t = useTranslation();

	const [dateRange, setDateRange] = useState({
		start: '',
		end: '',
	});

	const { start, end } = dateRange;

	const getAudits = useMethod('auditGetAuditions');

	const result = useQuery(['audits', { start, end }], async () => getAudits({ startDate: new Date(start), endDate: new Date(end) }));

	return (
		<Page>
			<Page.Header title={t('Message_auditing_log')} />
			<Page.Content>
				<Field alignSelf='stretch'>
					<Field.Label>{t('Date')}</Field.Label>
					<Field.Row>
						<DateRangePicker display='flex' flexGrow={1} onChange={setDateRange} />
					</Field.Row>
				</Field>
				<AuditLogTable data={result.data} />
			</Page.Content>
		</Page>
	);
};

export default AuditLogPage;
