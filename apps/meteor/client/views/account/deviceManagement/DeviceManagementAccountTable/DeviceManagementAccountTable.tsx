import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import DeviceManagementAccountRow from './DeviceManagementAccountRow';
import { GenericTableHeaderCell } from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import DeviceManagementTable from '../../../../components/deviceManagement/DeviceManagementTable';
import { useEndpointData } from '../../../../hooks/useEndpointData';

const sortMapping = {
	client: 'device.name',
	os: 'device.os.name',
	loginAt: 'loginAt',
};

const DeviceManagementAccountTable = (): ReactElement => {
	const { t } = useTranslation();
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

	const { value: data, phase, error, reload } = useEndpointData('/v1/sessions/list', { params: query });

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
			data={data}
			phase={phase}
			error={error}
			reload={reload}
			headers={headers}
			renderRow={(session): ReactElement => (
				<DeviceManagementAccountRow
					key={session._id}
					_id={session._id}
					deviceName={session.device?.name}
					deviceType={session.device?.type}
					deviceOSName={session.device?.os.name}
					loginAt={session.loginAt}
					onReload={reload}
				/>
			)}
			current={current}
			itemsPerPage={itemsPerPage}
			setCurrent={setCurrent}
			setItemsPerPage={setItemsPerPage}
			paginationProps={paginationProps}
		/>
	);
};

export default DeviceManagementAccountTable;
