import { Field } from '@rocket.chat/fuselage';
import { useTranslation, useMethod, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useState } from 'react';

import GenericNoResults from '../../../../../client/components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingRow,
	GenericTableHeader,
} from '../../../../../client/components/GenericTable';
import { createEndOfToday, createStartOfToday } from '../utils/dateRange';
import type { DateRange } from '../utils/dateRange';
import AuditLogEntry from './AuditLogEntry';
import DateRangePicker from './forms/DateRangePicker';

const AuditLogTable = (): ReactElement => {
	const t = useTranslation();

	const [dateRange, setDateRange] = useState<DateRange>(() => ({
		start: createStartOfToday(),
		end: createEndOfToday(),
	}));

	const dispatchToastMessage = useToastMessageDispatch();

	const getAudits = useMethod('auditGetAuditions');

	const { data, isLoading, isSuccess } = useQuery(
		['audits', dateRange],
		async () => {
			const { start, end } = dateRange;
			return getAudits({ startDate: start ?? new Date(0), endDate: end ?? new Date() });
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

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
				<Field.Label>{t('Date')}</Field.Label>
				<Field.Row>
					<DateRangePicker display='flex' flexGrow={1} value={dateRange} onChange={setDateRange} />
				</Field.Row>
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
