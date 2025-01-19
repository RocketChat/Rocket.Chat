import type { DeviceManagementPopulatedSession, DeviceManagementSession, Serialized } from '@rocket.chat/core-typings';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import type { ReactElement, MutableRefObject } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import DeviceManagementAdminRow from './DeviceManagementAdminRow';
import FilterByText from '../../../../components/FilterByText';
import { GenericTableHeaderCell } from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import DeviceManagementTable from '../../../../components/deviceManagement/DeviceManagementTable';
import { useEndpointData } from '../../../../hooks/useEndpointData';

const sortMapping = {
	client: 'device.name',
	username: '_user.username',
	os: 'device.os.name',
	loginAt: 'loginAt',
};

const isSessionPopulatedSession = (
	session: Serialized<DeviceManagementPopulatedSession | DeviceManagementSession>,
): session is Serialized<DeviceManagementPopulatedSession> => '_user' in session;

const DeviceManagementAdminTable = ({ reloadRef }: { reloadRef: MutableRefObject<() => void> }): ReactElement => {
	const { t } = useTranslation();
	const [text, setText] = useState('');
	const { current, itemsPerPage, setCurrent, setItemsPerPage, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'client' | 'os' | 'username' | 'loginAt'>('username');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				filter: text,
				sort: JSON.stringify({ [sortMapping[sortBy]]: sortDirection === 'asc' ? 1 : -1 }),
				count: itemsPerPage,
				offset: text ? undefined : current,
			}),
			[text, itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const { value: data, phase, error, reload } = useEndpointData('/v1/sessions/list.all', { params: query });

	useEffect(() => {
		reloadRef.current = reload;
	}, [reloadRef, reload]);

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key='client' direction={sortDirection} active={sortBy === 'client'} onClick={setSort} sort='client'>
				{t('Client')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='rcVersion'>{t('Version')}</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='os' direction={sortDirection} active={sortBy === 'os'} onClick={setSort} sort='os'>
				{t('OS')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='username' direction={sortDirection} active={sortBy === 'username'} onClick={setSort} sort='username'>
				{t('User')}
			</GenericTableHeaderCell>,
			mediaQuery && (
				<GenericTableHeaderCell key='loginAt' direction={sortDirection} active={sortBy === 'loginAt'} onClick={setSort} sort='loginAt'>
					{t('Last_login')}
				</GenericTableHeaderCell>
			),
			mediaQuery && <GenericTableHeaderCell key='_id'>{t('Device_ID')}</GenericTableHeaderCell>,
			mediaQuery && <GenericTableHeaderCell key='ip'>{t('IP_Address')}</GenericTableHeaderCell>,
			<GenericTableHeaderCell width='5%' key='menu' />,
		],
		[t, mediaQuery, setSort, sortDirection, sortBy],
	);

	return (
		<>
			<FilterByText placeholder={t('Search_Devices_Users')} value={text} onChange={(event) => setText(event.target.value)} />
			<DeviceManagementTable
				data={data}
				phase={phase}
				error={error}
				reload={reload}
				headers={headers}
				renderRow={(session): ReactElement => (
					<DeviceManagementAdminRow
						key={session._id}
						_id={session._id}
						username={isSessionPopulatedSession(session) ? session._user?.username : ''}
						ip={session.ip}
						deviceName={session?.device?.name}
						deviceType={session?.device?.type}
						deviceOSName={session?.device?.os?.name}
						rcVersion={session?.device?.version}
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
		</>
	);
};

export default DeviceManagementAdminTable;
