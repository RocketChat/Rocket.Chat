import type { DeviceManagementSession, DeviceManagementPopulatedSession, Serialized } from '@rocket.chat/core-typings';
import { Box, Pagination, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../GenericNoResults/GenericNoResults';
import { GenericTable, GenericTableHeader, GenericTableBody, GenericTableLoadingTable } from '../../GenericTable';

// FIXME: this tight coupling with the query result is not ideal; it indicates visual components should not be tightly
// coupled with data fetching logic.
type DeviceManagementTableProps<T> = UseQueryResult<PaginatedResult<{ sessions: Serialized<T>[] }>> & {
	headers: (ReactElement | false)[];
	renderRow: (data: Serialized<T>) => ReactElement;
	current?: ComponentProps<typeof Pagination>['current'];
	itemsPerPage?: ComponentProps<typeof Pagination>['itemsPerPage'];
	setCurrent?: ComponentProps<typeof Pagination>['onSetCurrent'];
	setItemsPerPage?: ComponentProps<typeof Pagination>['onSetItemsPerPage'];
	paginationProps?: Partial<ComponentProps<typeof Pagination>>;
};

// TODO: Missing error state
const DeviceManagementTable = <T extends DeviceManagementSession | DeviceManagementPopulatedSession>({
	isPending,
	isError,
	error,
	isSuccess,
	data,
	refetch,
	headers,
	renderRow,
	current,
	itemsPerPage,
	setCurrent,
	setItemsPerPage,
	paginationProps,
}: DeviceManagementTableProps<T>): ReactElement => {
	const { t } = useTranslation();

	if (isError) {
		return (
			<Box display='flex' justifyContent='center' alignItems='center' height='100%'>
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesSubtitle>{t('We_Could_not_retrive_any_data')}</StatesSubtitle>
					<StatesSubtitle>{error.message}</StatesSubtitle>
					<StatesActions>
						<StatesAction onClick={refetch}>{t('Retry')}</StatesAction>
					</StatesActions>
				</States>
			</Box>
		);
	}

	return (
		<>
			{data?.sessions.length === 0 && isSuccess && <GenericNoResults />}
			<GenericTable>
				{data?.sessions && data.sessions.length > 0 && headers && <GenericTableHeader>{headers}</GenericTableHeader>}
				<GenericTableBody>
					{isPending && <GenericTableLoadingTable headerCells={headers.filter(Boolean).length} />}
					{isSuccess && data?.sessions && data.sessions.map(renderRow)}
				</GenericTableBody>
			</GenericTable>
			{isSuccess && (
				<Pagination
					divider
					current={current}
					itemsPerPage={itemsPerPage}
					count={data?.total || 0}
					onSetCurrent={setCurrent}
					onSetItemsPerPage={setItemsPerPage}
					{...paginationProps}
				/>
			)}
		</>
	);
};

export default DeviceManagementTable;
