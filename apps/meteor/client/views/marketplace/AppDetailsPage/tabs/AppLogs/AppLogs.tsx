import { Box, Pagination } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AppLogsItem from './AppLogsItem';
import { CollapsiblePanel } from './Components/CollapsiblePanel';
import { AppLogsFilter } from './Filters/AppLogsFilter';
import { CustomScrollbars } from '../../../../../components/CustomScrollbars';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import AccordionLoading from '../../../components/AccordionLoading';
import { useLogs } from '../../../hooks/useLogs';

const AppLogs = ({ id }: { id: string }): ReactElement => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const { watch } = useFormContext();

	const { startTime, endTime, startDate, endDate, event, severity, instance } = watch();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const { data, isSuccess, isError, isLoading } = useLogs({
		appId: id,
		current,
		itemsPerPage,
		...(instance !== 'all' && { instanceId: instance }),
		...(severity !== 'all' && { logLevel: severity }),
		method: event,
		...(startTime && startDate && { startDate: new Date(`${startDate}T${startTime}`).toISOString() }),
		...(endTime && endDate && { endDate: new Date(`${endDate}T${endTime}`).toISOString() }),
	});

	return (
		<>
			<Box pb='x16'>
				<AppLogsFilter />
			</Box>
			{isLoading && <AccordionLoading />}
			{isError && (
				<Box maxWidth='x600' alignSelf='center'>
					{t('App_not_found')}
				</Box>
			)}
			{isSuccess && (
				<CustomScrollbars>
					<CollapsiblePanel width='100%' alignSelf='center'>
						{data?.logs?.map((log, index) => <AppLogsItem regionId={log._id} key={`${index}-${log._createdAt}`} {...log} />)}
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
