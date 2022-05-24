import { Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useState } from 'react';

import Page from '../../../client/components/Page';
import { useMethodData } from '../../../client/hooks/useMethodData';
import AuditLogTable from './AuditLogTable';
import DateRangePicker from './DateRangePicker';

const AuditLogPage = () => {
	const t = useTranslation();

	const [dateRange, setDateRange] = useState({
		start: '',
		end: '',
	});

	const { start, end } = dateRange;

	const params = useMemo(
		() => [
			{
				startDate: new Date(start),
				endDate: new Date(end),
			},
		],
		[end, start],
	);

	const { value: data } = useMethodData('auditGetAuditions', params);

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
				<AuditLogTable data={data} />
			</Page.Content>
		</Page>
	);
};

export default AuditLogPage;
