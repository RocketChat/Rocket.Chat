import { Box, Button, ButtonGroup, Field, FieldLabel, FieldRow, Margins } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useMethod } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingSelect } from './SettingSelect';
import DateRangePicker from './forms/DateRangePicker';
import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
	GenericTableRow,
} from '../../../components/GenericTable';
import type { DateRange } from '../utils/dateRange';
import { createEndOfToday, createStartOfToday } from '../utils/dateRange';

const SecurityLogsTable = (): ReactElement => {
	const { t } = useTranslation();
	const [value, setValue] = useState('');

	const [dateRange, setDateRange] = useState<DateRange>(() => ({
		start: createStartOfToday(),
		end: createEndOfToday(),
	}));

	// const getAudits = useMethod('auditGetAuditions');

	// const { data, isLoading, isSuccess } = useQuery({
	// 	queryKey: ['audits', dateRange],

	// 	queryFn: async () => {
	// 		const { start, end } = dateRange;
	// 		return getAudits({ startDate: start ?? new Date(0), endDate: end ?? new Date() });
	// 	},
	// 	meta: {
	// 		apiErrorToastMessage: true,
	// 	},
	// });

	// Mock Data, Remove once endpoint exists
	const data = [
		{
			_id: '1',
			actor: 'lero1',
			timestamp: '2021-10-01T00:00:00.000Z',
			setting: 'Show_message_in_email_notification',
			changedFrom: 'false',
			changedTo: 'true',
		},
		{
			_id: '2',
			actor: 'lero2',
			timestamp: '2021-10-01T00:00:00.000Z',
			setting: 'Show_message_in_email_notification',
			changedFrom: 'false',
			changedTo: 'true',
		},
		{
			_id: '3',
			actor: 'lero3',
			timestamp: '2021-10-01T00:00:00.000Z',
			setting: 'Show_message_in_email_notification',
			changedFrom: 'false',
			changedTo: 'true',
		},
		// Generate more 50 entries
		...Array.from({ length: 50 }, (_, index) => ({
			_id: `${index + 4}`,
			actor: `lero${index + 4}`,
			timestamp: '2021-10-01T00:00:00.000Z',
			setting: 'Show_message_in_email_notification',
			changedFrom: 'false',
			changedTo: 'true',
		})),
	];

	const isLoading = false;
	const isSuccess = true;

	const headers = (
		<>
			<GenericTableHeaderCell>{t('Actor')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Timestamp')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Setting')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Changed_from')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Changed_to')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			<Box mb={16} display='flex' flexWrap='nowrap' alignItems='flex-end'>
				<Field flexShrink={1}>
					<Margins inline={6}>
						<FieldLabel>{t('Date')}</FieldLabel>
						<DateRangePicker display='flex' flexGrow={1} value={dateRange} onChange={setDateRange} />
					</Margins>
				</Field>
				<Field flexShrink={1} width='40%'>
					<Margins inline={6}>
						<FieldLabel>{t('Setting')}</FieldLabel>
						<SettingSelect value={value} onChange={setValue} />
					</Margins>
				</Field>
				<ButtonGroup>
					<Margins inline={6}>
						<Button secondary>{t('Export_JSON')}</Button>
						<Button secondary>{t('Clear_filters')}</Button>
						<Button primary>{t('Apply_filters')}</Button>
					</Margins>
				</ButtonGroup>
			</Box>

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
						{data.map((item) => (
							<GenericTableRow key={item._id} tabIndex={0} role='link'>
								<GenericTableCell withTruncatedText>
									<Box display='flex' alignItems='center' mbe={16}>
										<UserAvatar size='x24' username={item.actor} />
										<Box display='flex' withTruncatedText mi={8}>
											<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
												<Box fontScale='p2m' withTruncatedText color='default'>
													{item.actor}
												</Box>
											</Box>
										</Box>
									</Box>
								</GenericTableCell>
								<GenericTableCell withTruncatedText>{item.timestamp}</GenericTableCell>
								<GenericTableCell withTruncatedText>{item.setting}</GenericTableCell>
								<GenericTableCell withTruncatedText>{item.changedFrom}</GenericTableCell>
								<GenericTableCell withTruncatedText>{item.changedTo}</GenericTableCell>
							</GenericTableRow>
						))}
					</GenericTableBody>
				</GenericTable>
			)}
		</>
	);
};

export default SecurityLogsTable;
