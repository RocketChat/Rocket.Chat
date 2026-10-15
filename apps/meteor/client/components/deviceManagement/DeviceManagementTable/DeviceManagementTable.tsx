import type { DeviceManagementSession, DeviceManagementPopulatedSession, Serialized } from '@rocket.chat/core-typings';
import {
	Box,
	Pagination,
	States,
	StatesAction,
	StatesActions,
	StatesIcon,
	StatesSubtitle,
	StatesTitle,
	type TableColumnWidth,
} from '@rocket.chat/fuselage';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { UsePaginatedQueryResult } from '@rocket.chat/ui-client';
import { GenericTable, GenericTableHeader, GenericTableBody, GenericTableLoadingTable, GenericNoResults } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// FIXME: this tight coupling with the query result is not ideal; it indicates visual components should not be tightly
// coupled with data fetching logic.
type DeviceManagementTableProps<T> = UsePaginatedQueryResult<PaginatedResult<{ sessions: Serialized<T>[] }>> & {
	headers: ReactNode[];
	columns?: TableColumnWidth[];
	renderRow: (data: Serialized<T>) => ReactNode;
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
	columns,
	renderRow,
	paginationProps,
}: DeviceManagementTableProps<T>) => {
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
						<StatesAction onClick={() => refetch()}>{t('Retry')}</StatesAction>
					</StatesActions>
				</States>
			</Box>
		);
	}

	return (
		<>
			{data?.sessions.length === 0 && isSuccess && <GenericNoResults />}
			<GenericTable columns={columns} aria-label={t('Devices')}>
				{data?.sessions && data.sessions.length > 0 && headers && <GenericTableHeader>{headers}</GenericTableHeader>}
				<GenericTableBody>
					{isPending && <GenericTableLoadingTable headerCells={headers.filter(Boolean).length} />}
					{isSuccess && data?.sessions && data.sessions.map(renderRow)}
				</GenericTableBody>
			</GenericTable>
			{isSuccess && <Pagination divider {...paginationProps} />}
		</>
	);
};

export default DeviceManagementTable;
