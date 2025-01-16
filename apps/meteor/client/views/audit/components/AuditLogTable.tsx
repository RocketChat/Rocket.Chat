import { Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useTranslation, useMethod } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useState } from 'react';

import AuditLogEntry from './AuditLogEntry';
import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingRow,
	GenericTableHeader,
} from '../../../components/GenericTable';
import { createEndOfToday, createStartOfToday } from '../utils/dateRange';
import type { DateRange } from '../utils/dateRange';
import DateRangePicker from './forms/DateRangePicker';

const AuditLogTable = (): ReactElement => {
	const t = useTranslation();

	const [dateRange, setDateRange] = useState<DateRange>(() => ({
		start: createStartOfToday(),
		end: createEndOfToday(),
	}));

	const getAudits = useMethod('auditGetAuditions');

	const { data, isLoading, isSuccess } = useQuery({
		queryKey: ['audits', dateRange],

		queryFn: async () => {
			const { start, end } = dateRange;
			return getAudits({ startDate: start ?? new Date(0), endDate: end ?? new Date() });
		},
		meta: {
			apiErrorToastMessage: true,
		},
	});

	const headers = (
		<>
			<GenericTableHeaderCell>{t('User')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Looked_for')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('When')}</GenericTableHeaderCell>
			<GenericTableHeaderCell width={80}>{t('Results')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Filters_applied')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			<Field alignSelf='stretch'>
				<FieldLabel>{t('Date')}</FieldLabel>
				<FieldRow>
					<DateRangePicker display='flex' flexGrow={1} value={dateRange} onChange={setDateRange} />
				</FieldRow>
			</Field>
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={4} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.length === 0 && <GenericNoResults />}
			{isSuccess && data.length > 0 && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						{data.map((auditLog) => (
							<AuditLogEntry key={auditLog._id} value={auditLog} />
						))}
					</GenericTableBody>
				</GenericTable>
			)}
		</>
	);
};

export default AuditLogTable;
