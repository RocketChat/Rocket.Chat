import type { DeviceManagementSession, DeviceManagementPopulatedSession, Serialized } from '@rocket.chat/core-typings';
import { Box, Pagination, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

import {
	GenericTable,
	GenericTableHeader,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../../../client/components/GenericTable';
import { AsyncStatePhase } from '../../../../../client/lib/asyncState';

type DeviceManagementTableProps<T> = {
	data?: Serialized<PaginatedResult<{ sessions: T[] }>>;
	phase?: Partial<AsyncStatePhase>;
	error?: Error;
	reload?: () => void;
	headers: (ReactElement | false)[];
	renderRow: (data: Serialized<T>) => ReactElement;
	current?: ComponentProps<typeof Pagination>['current'];
	itemsPerPage?: ComponentProps<typeof Pagination>['itemsPerPage'];
	setCurrent?: ComponentProps<typeof Pagination>['onSetCurrent'];
	setItemsPerPage?: ComponentProps<typeof Pagination>['onSetItemsPerPage'];
	paginationProps?: Partial<ComponentProps<typeof Pagination>>;
};

const DeviceManagementTable = <T extends DeviceManagementSession | DeviceManagementPopulatedSession>({
	data,
	phase,
	error,
	reload,
	headers,
	renderRow,
	current,
	itemsPerPage,
	setCurrent,
	setItemsPerPage,
	paginationProps,
}: DeviceManagementTableProps<T>): ReactElement => {
	const t = useTranslation();

	if (!data && phase === AsyncStatePhase.REJECTED) {
		return (
			<Box display='flex' justifyContent='center' alignItems='center' height='100%'>
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesSubtitle>{t('We_Could_not_retrive_any_data')}</StatesSubtitle>
					<StatesSubtitle>{error?.message}</StatesSubtitle>
					<StatesActions>
						<StatesAction onClick={reload}>{t('Retry')}</StatesAction>
					</StatesActions>
				</States>
			</Box>
		);
	}

	return (
		<>
			{data?.sessions.length === 0 && phase === AsyncStatePhase.RESOLVED && (
				<States>
					<StatesIcon name='magnifier' />
					<StatesTitle>{t('No_results_found')}</StatesTitle>
				</States>
			)}
			<GenericTable>
				{data?.sessions && data.sessions.length > 0 && headers && <GenericTableHeader>{headers}</GenericTableHeader>}
				<GenericTableBody>
					{phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={headers.filter(Boolean).length} />}
					{phase === AsyncStatePhase.RESOLVED && data?.sessions && data.sessions.map(renderRow)}
				</GenericTableBody>
			</GenericTable>
			{phase === AsyncStatePhase.RESOLVED && (
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
