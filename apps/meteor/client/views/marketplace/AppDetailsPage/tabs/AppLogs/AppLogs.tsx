import { Box, Pagination } from '@rocket.chat/fuselage';
import { useRef, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AppLogsItem from './AppLogsItem';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import AccordionLoading from '../../../components/AccordionLoading';
import { useLogs } from '../../../hooks/useLogs';

const AppLogs = ({ id }: { id: string }): ReactElement => {
	const { t } = useTranslation();
	const scrollableRef = useRef<HTMLDivElement>(null);
	const formatDateAndTime = useFormatDateAndTime();
	const { setCurrent, setItemsPerPage, ...pagination } = usePagination();
	const { data, isSuccess, isError, isLoading } = useLogs({
		appId: id,
		count: pagination.itemsPerPage,
		offset: pagination.current,
	});

	return (
		<>
			{isLoading && <AccordionLoading />}
			{isError && (
				<Box maxWidth='x600' alignSelf='center'>
					{t('App_not_found')}
				</Box>
			)}
			{isSuccess && (
				<>
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
