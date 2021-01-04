import React, { useMemo, useState } from 'react';
import { Field } from '@rocket.chat/fuselage';

import Page from '../../../client/components/Page';
import DateRangePicker from './DateRangePicker';
import AuditLogTable from './AuditLogTable';
import { useTranslation } from '../../../client/contexts/TranslationContext';
import { useMethodData } from '../../../client/hooks/useMethodData';

const AuditLogPage = () => {
	const t = useTranslation();

	const [dateRange, setDateRange] = useState({
		start: '',
		end: '',
	});

	const {
		start,
		end,
	} = dateRange;

	const params = useMemo(() => [{
		startDate: new Date(start),
		endDate: new Date(end),
	}], [end, start]);

	const { value: data } = useMethodData('auditGetAuditions', params);

	return <Page>
		<Page.Header title={t('Message_auditing_log')} />
		<Page.Content>
			<Field alignSelf='stretch'>
				<Field.Label>{t('Date')}</Field.Label>
				<Field.Row>
					<DateRangePicker display='flex' flexGrow={1} onChange={setDateRange}/>
				</Field.Row>
			</Field>
			<AuditLogTable data={data} />
		</Page.Content>
	</Page>;
};

export default AuditLogPage;
