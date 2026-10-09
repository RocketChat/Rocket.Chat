import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { GenericTableHeaderCell, usePaginatedQueryKey, useSort } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import DeviceManagementAccountRow from './DeviceManagementAccountRow';
import DeviceManagementTable from '../../../../components/deviceManagement/DeviceManagementTable';
import { deviceManagementQueryKeys } from '../../../../lib/queryKeys';

const sortMapping = {
	client: 'device.name',
	os: 'device.os.name',
	loginAt: 'loginAt',
};

const DeviceManagementAccountTable = () => {
	const { t } = useTranslation();
	const { sortBy, sortDirection, setSort } = useSort<'client' | 'os' | 'loginAt'>('loginAt');

	const query = useMemo(
		() => ({
			sort: JSON.stringify({ [sortMapping[sortBy]]: sortDirection === 'asc' ? 1 : -1 }),
		}),
		[sortBy, sortDirection],
	);
	const { paginatedQuery, queryKey, paginationProps } = usePaginatedQueryKey({
		query,
		getQueryKey: deviceManagementQueryKeys.userSessions,
	});

	const listSessions = useEndpoint('GET', '/v1/sessions/list');
	const queryResult = useQuery({
		queryKey,
		queryFn: async () => {
			const result = await listSessions(paginatedQuery);
			return { ...result, count: result.sessions.length };
		},
	});

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key='client' direction={sortDirection} active={sortBy === 'client'} onClick={setSort} sort='client'>
				{t('Client')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='os' direction={sortDirection} active={sortBy === 'os'} onClick={setSort} sort='os'>
				{t('OS')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='loginAt' direction={sortDirection} active={sortBy === 'loginAt'} onClick={setSort} sort='loginAt'>
				{t('Last_login')}
			</GenericTableHeaderCell>,
			mediaQuery && <GenericTableHeaderCell key='_id'>{t('Device_ID')}</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='logout' />,
		],
		[t, mediaQuery, sortDirection, sortBy, setSort],
	);

	return (
		<DeviceManagementTable
			{...queryResult}
			headers={headers}
			renderRow={(session) => (
				<DeviceManagementAccountRow
					key={session._id}
					_id={session._id}
					deviceName={session.device?.name}
					deviceType={session.device?.type}
					deviceOSName={session.device?.os.name}
					loginAt={session.loginAt}
					current={session.current}
				/>
			)}
			paginationProps={paginationProps}
		/>
	);
};

export default DeviceManagementAccountTable;
