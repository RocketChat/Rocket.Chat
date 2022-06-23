import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, StatesAction, StatesActions, Pagination } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useMemo } from 'react';

import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../../../client/components/GenericTable';
import { usePagination } from '../../../../../client/components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../../client/components/GenericTable/hooks/useSort';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../client/lib/asyncState';
import DeviceManagementRow from './DeviceManagementRow';

const sortMapping = {
	client: 'device.name',
	os: 'device.os.name',
	loginAt: 'loginAt',
};

const DeviceManagementTable = (): ReactElement => {
	const t = useTranslation();
	const { current, itemsPerPage, setCurrent, setItemsPerPage, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'client' | 'os' | 'loginAt'>('loginAt');

	const query = useMemo(
		() => ({
			sort: JSON.stringify({ [sortMapping[sortBy]]: sortDirection === 'asc' ? 1 : -1 }),
			count: itemsPerPage,
			offset: current,
		}),
		[itemsPerPage, current, sortBy, sortDirection],
	);

	const { value: data, phase, error, reload } = useEndpointData('/v1/sessions/list', query);

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	if (!data && phase === AsyncStatePhase.REJECTED) {
		return (
			<Box display='flex' justifyContent='center' alignItems='center' height='100%'>
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_Went_Wrong')}</StatesTitle>
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
			{data?.sessions.length === 0 && (
				<States>
					<StatesIcon name='magnifier' />
					<StatesTitle>{t('No_results_found')}</StatesTitle>
				</States>
			)}
			{data?.sessions && data.sessions.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>
							<GenericTableHeaderCell
								key={'client'}
								direction={sortDirection}
								active={sortBy === 'client'}
								onClick={setSort}
								sort={'client'}
							>
								{t('Client')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell key={'os'} direction={sortDirection} active={sortBy === 'os'} onClick={setSort} sort={'os'}>
								{t('OS')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell
								key={'loginAt'}
								direction={sortDirection}
								active={sortBy === 'loginAt'}
								onClick={setSort}
								sort={'loginAt'}
							>
								{t('Last_Login')}
							</GenericTableHeaderCell>
							{mediaQuery && <GenericTableHeaderCell key={'_id'}>{t('Device_ID')}</GenericTableHeaderCell>}
							<GenericTableHeaderCell key={'logout'} />
						</GenericTableHeader>
						<GenericTableBody>
							{phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={4} />}
							{phase === AsyncStatePhase.RESOLVED &&
								data?.sessions &&
								data.sessions.map((session) => (
									<DeviceManagementRow
										key={session._id}
										_id={session._id}
										deviceName={session.device?.name}
										deviceType={session.device?.type}
										deviceOSName={session.device?.os.name}
										deviceOSVersion={session.device?.os.version}
										loginAt={session.loginAt}
										onReload={reload}
									/>
								))}
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
			)}
		</>
	);
};

export default DeviceManagementTable;
