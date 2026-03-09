import type { ILogItem } from '@rocket.chat/core-typings';
import { Box, Pagination } from '@rocket.chat/fuselage';
import { CustomScrollbars, usePagination } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo, useReducer, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import AppLogsItem from './AppLogsItem';
import { CollapsiblePanel } from './Components/CollapsiblePanel';
import { AppLogsFilter } from './Filters/AppLogsFilter';
import { useAppLogsFilterFormContext } from './useAppLogsFilterForm';
import GenericError from '../../../../../components/GenericError';
import GenericNoResults from '../../../../../components/GenericNoResults';
import AccordionLoading from '../../../components/AccordionLoading';
import { useLogs } from '../../../hooks/useLogs';

function expandedReducer(
	expandedStates: { id: string; expanded: boolean }[],
	action:
		| { type: 'update'; id: string; expanded: boolean }
		| { type: 'expand-all' }
		| { type: 'reset-all' }
		| { type: 'reset'; logs: ILogItem[] },
) {
	switch (action.type) {
		case 'update':
			return expandedStates.map((state) => (state.id === action.id ? { ...state, expanded: action.expanded } : state));

		case 'expand-all':
			return expandedStates.map((state) => ({ ...state, expanded: true }));

		case 'reset':
			return action.logs.map((log) => ({ id: log._id, expanded: false }));

		case 'reset-all':
			return expandedStates.map((state) => ({ ...state, expanded: false }));

		default:
			return expandedStates;
	}
}

const AppLogs = ({ id }: { id: string }): ReactElement => {
	const { t } = useTranslation();

	const router = useRouter();

	const { instanceId: instanceLogsFilter } = router.getSearchParameters();

	const { watch, setValue } = useAppLogsFilterFormContext();

	useEffect(() => {
		if (instanceLogsFilter) {
			setValue('instance', instanceLogsFilter);
		}
	}, [instanceLogsFilter, setValue]);

	const { startTime, endTime, startDate, endDate, event, severity, instance } = watch();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const [expandedStates, dispatch] = useReducer(expandedReducer, []);

	const handleExpand = ({ id, expanded }: { id: string; expanded: boolean }) => dispatch({ id, expanded, type: 'update' });

	const handleExpandAll = () => dispatch({ type: 'expand-all' });

	const handleCollapseAll = () => dispatch({ type: 'reset-all' });

	const { data, isSuccess, isError, error, refetch, isFetching } = useLogs({
		appId: id,
		current,
		itemsPerPage,
		...(instance !== 'all' && { instanceId: instance }),
		...(severity !== 'all' && { logLevel: severity }),
		...(event !== 'all' && { method: event }),
		...(startTime && startDate && { startDate: new Date(`${startDate}T${startTime}`).toISOString() }),
		...(endTime && endDate && { endDate: new Date(`${endDate}T${endTime}`).toISOString() }),
	});

	useEffect(() => {
		if (isSuccess) {
			dispatch({ type: 'reset', logs: data.logs });
		}
	}, [data, isSuccess]);

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
				<AppLogsFilter
					appId={id}
					noResults={isFetching || !isSuccess || data?.logs?.length === 0}
					isLoading={isFetching}
					expandAll={() => handleExpandAll()}
					collapseAll={() => handleCollapseAll()}
					refetchLogs={() => refetch()}
				/>
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
								expanded={expandedStates.find((state) => state.id === log._id)?.expanded || false}
								onExpand={handleExpand}
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
