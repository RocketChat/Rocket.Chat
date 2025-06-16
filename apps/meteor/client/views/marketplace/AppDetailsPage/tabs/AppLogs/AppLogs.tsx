import { Accordion, Box, Pagination } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AppLogsItem from './AppLogsItem';
import { CustomScrollbars } from '../../../../../components/CustomScrollbars';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import AccordionLoading from '../../../components/AccordionLoading';
import { useLogs } from '../../../hooks/useLogs';

const AppLogs = ({ id }: { id: string }): ReactElement => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { data, isSuccess, isError, isLoading } = useLogs({ appId: id, current, itemsPerPage });

	return (
		<>
			{isLoading && <AccordionLoading />}
			{isError && (
				<Box maxWidth='x600' alignSelf='center'>
					{t('App_not_found')}
				</Box>
			)}
			{isSuccess && (
				<CustomScrollbars>
					<Accordion width='100%' alignSelf='center'>
						{data?.logs?.map((log) => (
							<AppLogsItem
								key={log._createdAt}
								title={`${formatDateAndTime(log._createdAt)}: "${log.method}" (${log.totalTime}ms)`}
								instanceId={log.instanceId}
								entries={log.entries}
							/>
						))}
					</Accordion>
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
