import { Field } from '@rocket.chat/fuselage';
import { useMethod, useTranslation, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../../../client/components/Page';
import PageContent from '../../../../client/components/Page/PageContent';
import PageHeader from '../../../../client/components/Page/PageHeader';
import AuditLogTable from './components/AuditLogTable';
import DateRangePicker, { useDateRange } from './components/DateRangePicker';

const AuditLogPage = (): ReactElement => {
	const [dateRange, setDateRange] = useDateRange();
	const { start, end } = dateRange;

	const dispatchToastMessage = useToastMessageDispatch();

	const getAudits = useMethod('auditGetAuditions');

	const auditsQueryResult = useQuery(
		['audits', { start, end }],
		async () => getAudits({ startDate: start ?? new Date(0), endDate: end ?? new Date() }),
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	const t = useTranslation();

	return (
		<Page>
			<PageHeader title={t('Message_auditing_log')} />
			<PageContent>
				<Field alignSelf='stretch'>
					<Field.Label>{t('Date')}</Field.Label>
					<Field.Row>
						<DateRangePicker display='flex' flexGrow={1} value={dateRange} onChange={setDateRange} />
					</Field.Row>
				</Field>
				<AuditLogTable data={auditsQueryResult.data} />
			</PageContent>
		</Page>
	);
};

export default AuditLogPage;
