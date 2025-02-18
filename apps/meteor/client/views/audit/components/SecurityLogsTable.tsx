import { Box, Button, ButtonGroup, Field, FieldLabel, Margins, Pagination } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { SecurityLogDisplay } from './SecurityLogDisplayModal';
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
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import type { DateRange } from '../utils/dateRange';
import { createEndOfToday, createStartOfToday } from '../utils/dateRange';

const SecurityLogsTable = (): ReactElement => {
	const { t } = useTranslation();
	const [setting, setSetting] = useState('');

	const setModal = useSetModal();

	const [dateRange, setDateRange] = useState<DateRange>(() => ({
		start: createStartOfToday(),
		end: createEndOfToday(),
	}));

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	// const handleExportJson = () => {
	// 	return undefined;
	// };

	const handleClearFilters = () => {
		setSetting('');
		setDateRange({ start: createStartOfToday(), end: createEndOfToday() });
	};

	const handleApplyFilters = () => {
		return undefined;
	};

	const handleItemClick = ({
		actor,
		timestamp,
		setting,
		changedFrom,
		changedTo,
		type,
	}: {
		actor: string;
		timestamp: string;
		setting: string;
		changedFrom: string;
		changedTo: string;
		type: 'code' | 'string';
	}) => {
		setModal(
			<SecurityLogDisplay
				settingType={type}
				timestamp={timestamp}
				actor={actor}
				setting={setting}
				changedFrom={changedFrom}
				changedTo={changedTo}
				onCancel={() => setModal(null)}
			/>,
		);
	};

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
			type: 'string' as const,
		},
		{
			_id: '2',
			actor: 'lero2',
			timestamp: '2021-10-01T00:00:00.000Z',
			setting: 'Show_message_in_email_notification',
			changedFrom: 'false',
			changedTo: 'true',
			type: 'string' as const,
		},
		{
			_id: '3',
			actor: 'lero3',
			timestamp: '2021-10-01T00:00:00.000Z',
			setting: 'Show_message_in_email_notification',
			changedFrom: 'console.log("test")',
			changedTo: 'console.testing.long.string.test.test.test.test.test.test.test("Hello Test!")',
			type: 'code' as const,
		},
		// Generate more 50 entries
		...Array.from({ length: 50 }, (_, index) => ({
			_id: `${index + 4}`,
			actor: `lero${index + 4}`,
			timestamp: '2021-10-01T00:00:00.000Z',
			setting: 'Show_message_in_email_notification',
			changedFrom: 'false',
			changedTo: 'true',
			type: 'string' as const,
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
				<Field width={300}>
					<Margins inline={6}>
						<FieldLabel>{t('Setting')}</FieldLabel>
						<SettingSelect value={setting} onChange={setSetting} />
					</Margins>
				</Field>
				<ButtonGroup>
					<Margins inline={6}>
						{/* <Button secondary onClick={handleExportJson}>
							{t('Export_JSON')}
						</Button> */}
						<Button secondary onClick={handleClearFilters}>
							{t('Clear_filters')}
						</Button>
						<Button primary onClick={handleApplyFilters}>
							{t('Apply_filters')}
						</Button>
					</Margins>
				</ButtonGroup>
			</Box>

			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={5} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.length === 0 && <GenericNoResults />}
			{isSuccess && data.length > 0 && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						{data.map((item) => (
							<GenericTableRow key={item._id} role='link' action tabIndex={0} onClick={() => handleItemClick({ ...item })}>
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
								<GenericTableCell withTruncatedText title={t(item.setting)}>
									{item.setting}
								</GenericTableCell>
								<GenericTableCell withTruncatedText>{item.changedFrom}</GenericTableCell>
								<GenericTableCell withTruncatedText>{item.changedTo}</GenericTableCell>
							</GenericTableRow>
						))}
					</GenericTableBody>
				</GenericTable>
			)}
			<Pagination
				divider
				current={current}
				itemsPerPage={itemsPerPage}
				count={data.length || 0}
				onSetItemsPerPage={onSetItemsPerPage}
				onSetCurrent={onSetCurrent}
				{...paginationProps}
			/>
		</>
	);
};

export default SecurityLogsTable;
