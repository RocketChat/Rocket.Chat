import { Box, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AppLogsItem from './AppLogsItem';
import { CollapsiblePanel } from './Components/CollapsiblePanel';
import { AppLogsFilter } from './Filters/AppLogsFilter';
import { useAppLogsFilterFormContext } from './useAppLogsFilterForm';
import { CustomScrollbars } from '../../../../../components/CustomScrollbars';
import GenericError from '../../../../../components/GenericError';
import GenericNoResults from '../../../../../components/GenericNoResults';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import AccordionLoading from '../../../components/AccordionLoading';
import { useLogs } from '../../../hooks/useLogs';

const AppLogs = ({ id }: { id: string }): ReactElement => {
	const { t } = useTranslation();

	const { watch } = useAppLogsFilterFormContext();

	const { startTime, endTime, startDate, endDate, event, severity, instance } = watch();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const [expandOverride, setExpandOverride] = useState(false);

	const expandAll = () => setExpandOverride(true);

	const debouncedEvent = useDebouncedValue(event, 500);

	const { data, isSuccess, isError, error, refetch, isFetching } = useLogs({
		appId: id,
		current,
		itemsPerPage,
		...(instance !== 'all' && { instanceId: instance }),
		...(severity !== 'all' && { logLevel: severity }),
		method: debouncedEvent,
		...(startTime && startDate && { startDate: new Date(`${startDate}T${startTime}`).toISOString() }),
		...(endTime && endDate && { endDate: new Date(`${endDate}T${endTime}`).toISOString() }),
	});

	const parsedError = useMemo(() => {
		if (error) {
			// TODO: Check why tanstack expects a default Error but we return {error: string}
			if ((error as unknown as { error: string }).error === 'Invalid date range') {
				return t('error-invalid-dates');
			}

			return t('Something_Went_Wrong');
		}
	}, [error, t]);

	return (
		<>
			<Box pb={16}>
				<AppLogsFilter expandAll={expandAll} refetchLogs={() => refetch()} isLoading={isFetching} />
			</Box>
			{isFetching && <AccordionLoading />}
			{isError && <GenericError title={parsedError} />}
			{!isFetching && isSuccess && data?.logs?.length === 0 && <GenericNoResults />}
			{!isFetching && isSuccess && data?.logs?.length > 0 && (
				<CustomScrollbars>
					<CollapsiblePanel width='100%' alignSelf='center'>
						{data?.logs?.map((log, index) => (
							<AppLogsItem
								regionId={log._id}
								setExpandOverride={setExpandOverride}
								expandOverride={expandOverride}
								key={`${index}-${log._createdAt}`}
								{...log}
							/>
						))}
					</CollapsiblePanel>
				</CustomScrollbars>
			)}
			<Pagination
				divider
				current={current}
				itemsPerPage={itemsPerPage}
				count={data?.total || 0}
				onSetItemsPerPage={onSetItemsPerPage}
				onSetCurrent={onSetCurrent}
				{...paginationProps}
			/>
		</>
	);
};

export default AppLogs;
