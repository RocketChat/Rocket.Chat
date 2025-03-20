import { Box, Button } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericTableCell, GenericTableRow } from '../../../../components/GenericTable';
import DeviceIcon from '../../../../components/deviceManagement/DeviceIcon';
import { useDeviceLogout } from '../../../../hooks/useDeviceLogout';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';

type DevicesRowProps = {
	_id: string;
	deviceName?: string;
	deviceType?: string;
	deviceOSName?: string;
	loginAt: string;
	onReload: () => void;
};

const DeviceManagementAccountRow = ({
	_id,
	deviceName,
	deviceType = 'browser',
	deviceOSName,
	loginAt,
	onReload,
}: DevicesRowProps): ReactElement => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const handleDeviceLogout = useDeviceLogout(_id, '/v1/sessions/logout.me');

	return (
		<GenericTableRow key={_id}>
			<GenericTableCell>
				<Box display='flex' alignItems='center'>
					<DeviceIcon deviceType={deviceType} />
					{deviceName && <Box withTruncatedText>{deviceName}</Box>}
				</Box>
			</GenericTableCell>
			<GenericTableCell>{deviceOSName || ''}</GenericTableCell>
			<GenericTableCell>{formatDateAndTime(loginAt)}</GenericTableCell>
			{mediaQuery && <GenericTableCell>{_id}</GenericTableCell>}
			<GenericTableCell align='end'>
				<Button onClick={(): void => handleDeviceLogout(onReload)}>{t('Logout')}</Button>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default DeviceManagementAccountRow;
