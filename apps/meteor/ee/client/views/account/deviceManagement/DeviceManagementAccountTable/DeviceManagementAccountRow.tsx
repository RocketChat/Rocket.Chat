import { Box, Button, TableRow, TableCell } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useFormatDateAndTime } from '../../../../../../client/hooks/useFormatDateAndTime';
import DeviceIcon from '../../../../deviceManagement/components/DeviceIcon';
import { useDeviceLogout } from '../../../../hooks/useDeviceLogout';

type DevicesRowProps = {
	_id: string;
	deviceName?: string;
	deviceType?: string;
	deviceOSName?: string;
	deviceOSVersion?: string;
	loginAt: string;
	onReload: () => void;
};

const DeviceManagementAccountRow = ({
	_id,
	deviceName,
	deviceType = 'browser',
	deviceOSName,
	deviceOSVersion,
	loginAt,
	onReload,
}: DevicesRowProps): ReactElement => {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const handleDeviceLogout = useDeviceLogout(_id, '/v1/sessions/logout.me');

	return (
		<TableRow key={_id}>
			<TableCell>
				<Box display='flex' alignItems='center'>
					<DeviceIcon deviceType={deviceType} />
					{deviceName && <Box withTruncatedText>{deviceName}</Box>}
				</Box>
			</TableCell>
			<TableCell>{`${deviceOSName || ''} ${deviceOSVersion || ''}`}</TableCell>
			<TableCell>{formatDateAndTime(loginAt)}</TableCell>
			{mediaQuery && <TableCell>{_id}</TableCell>}
			<TableCell align='end'>
				<Button onClick={(): void => handleDeviceLogout(onReload)}>{t('Logout')}</Button>
			</TableCell>
		</TableRow>
	);
};

export default DeviceManagementAccountRow;
