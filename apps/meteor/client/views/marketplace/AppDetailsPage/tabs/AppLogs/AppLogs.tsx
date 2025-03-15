import { Box, Field, FieldLabel, FieldRow, Pagination, Select, type SelectOption } from '@rocket.chat/fuselage';
import { useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AppLogsItem from './AppLogsItem';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import DateRangePicker from '../../../../audit/components/forms/DateRangePicker';
import AccordionLoading from '../../../components/AccordionLoading';
import { type LogsFilters, useLogs } from '../../../hooks/useLogs';

const AppLogs = ({ id }: { id: string }): ReactElement => {
	const { t } = useTranslation();
	const scrollableRef = useRef<HTMLDivElement>(null);
	const formatDateAndTime = useFormatDateAndTime();
	const [filters, setFilters] = useState<LogsFilters>({ logLevel: '0' });
	const { setCurrent, setItemsPerPage, ...pagination } = usePagination();
	const { data, isSuccess, isError, isLoading } = useLogs({
		filters,
		appId: id,
		count: pagination.itemsPerPage,
		offset: pagination.current,
	});

	const logLevelOptions: SelectOption[] = [
		['0', t('0_Errors_Only'), filters.logLevel === '0'],
		['1', t('1_Errors_and_Information'), filters.logLevel === '1'],
		['2', t('2_Erros_Information_and_Debug'), filters.logLevel === '2'],
	];

	return (
		<>
			{isLoading && <AccordionLoading />}
			{isError && (
				<Box maxWidth='x600' alignSelf='center' pi={24}>
					{t('App_not_found')}
				</Box>
			)}
			{isSuccess && (
				<>
					<Box is='form' paddingInline={24}>
						<Field>
							<FieldLabel>{t('Date')}</FieldLabel>
							<FieldRow>
								<DateRangePicker
									display='flex'
									flexDirection='row'
									value={filters.dateRange}
									onChange={(dateRange) => setFilters({ ...filters, dateRange })}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel>{t('Log_Level')}</FieldLabel>
							<FieldRow>
								<Select
									value={filters.logLevel}
									options={logLevelOptions}
									onChange={(key) => setFilters({ ...filters, logLevel: key as LogsFilters['logLevel'] })}
								/>
							</FieldRow>
						</Field>
					</Box>
					<Box display='flex' flexDirection='column' overflow='hidden' height='100%' pi={24}>
						<Box ref={scrollableRef} overflowY='scroll' height='100%'>
							{data?.logs?.map((log) => (
								<AppLogsItem
									key={log._createdAt}
									title={`${formatDateAndTime(log._createdAt)}: "${log.method}" (${log.totalTime}ms)`}
									instanceId={log.instanceId}
									entries={log.entries}
								/>
							))}
						</Box>
					</Box>
					{Boolean(data?.total) && (
						<Pagination
							divider
							count={data.total}
							onSetItemsPerPage={setItemsPerPage}
							onSetCurrent={(value) => {
								setCurrent(value);
								scrollableRef.current?.scrollTo(0, 0);
							}}
							{...pagination}
						/>
					)}
				</>
			)}
		</>
	);
};

export default AppLogs;
