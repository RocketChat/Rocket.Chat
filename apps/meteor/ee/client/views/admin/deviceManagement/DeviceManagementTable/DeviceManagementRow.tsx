import { Box, TableRow, TableCell, Menu, Option } from '@rocket.chat/fuselage';
import { useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useRoute, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { KeyboardEvent, ReactElement, useMemo, useCallback } from 'react';

import GenericModal from '../../../../../../client/components/GenericModal';
import { useEndpointAction } from '../../../../../../client/hooks/useEndpointAction';
import { useFormatDateAndTime } from '../../../../../../client/hooks/useFormatDateAndTime';
import DeviceIcon from './DeviceIcon';

type DeviceRowProps = {
	_id: string;
	username?: string;
	ip: string;
	deviceName?: string;
	deviceType?: string;
	deviceOSName?: string;
	deviceOSVersion?: string;
	loginAt: string;
	onReload: () => void;
};

const DevicesRow = ({
	_id,
	username,
	ip,
	deviceName,
	deviceType = 'browser',
	deviceOSName = '',
	deviceOSVersion = '',
	loginAt,
	onReload,
}: DeviceRowProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const deviceManagementRouter = useRoute('device-management');
	const formatDateAndTime = useFormatDateAndTime();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const handleClick = useMutableCallback((): void => {
		deviceManagementRouter.push({
			context: 'info',
			id: _id,
		});
	});

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLOrSVGElement>): void => {
			if (!['Enter', 'Space'].includes(e.nativeEvent.code)) {
				return;
			}
			handleClick();
		},
		[handleClick],
	);

	const logoutDevice = useEndpointAction(
		'POST',
		'/v1/sessions/logout',
		useMemo(() => ({ sessionId: _id }), [_id]),
	);

	const handleLogoutDeviceModal = useCallback(() => {
		const closeModal = (): void => setModal(null);

		const handleLogoutDevice = async (): Promise<void> => {
			try {
				await logoutDevice();
				onReload();
				dispatchToastMessage({ type: 'success', message: t('Device_Logged_Out') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: String(error) });
			} finally {
				closeModal();
			}
		};

		setModal(
			<GenericModal
				title={t('Logout_Device')}
				variant='danger'
				confirmText={t('Logout_Device')}
				cancelText={t('Cancel')}
				onConfirm={handleLogoutDevice}
				onCancel={closeModal}
				onClose={closeModal}
			>
				{t('Device_Logout_Text')}
			</GenericModal>,
		);
	}, [t, onReload, logoutDevice, setModal, dispatchToastMessage]);

	const menuOptions = {
		logout: {
			label: { label: t('Logout_Device'), icon: 'sign-out' },
			action: (): void => handleLogoutDeviceModal(),
		},
	};

	return (
		<TableRow key={_id} onKeyDown={handleKeyDown} onClick={handleClick} tabIndex={0} action>
			<TableCell>
				<Box display='flex' alignItems='center'>
					<DeviceIcon deviceType={deviceType} />
					{deviceName && <Box withTruncatedText>{deviceName}</Box>}
				</Box>
			</TableCell>
			<TableCell>{`${deviceOSName} ${deviceOSVersion}`}</TableCell>
			<TableCell withTruncatedText>{username}</TableCell>
			{mediaQuery && <TableCell>{formatDateAndTime(loginAt)}</TableCell>}
			{mediaQuery && <TableCell withTruncatedText>{_id}</TableCell>}
			{mediaQuery && <TableCell>{ip}</TableCell>}
			<TableCell onClick={(e): void => e.stopPropagation()}>
				<Menu
					title={t('Options')}
					options={menuOptions}
					renderItem={({ label: { label, icon }, ...props }): ReactElement => <Option label={label} icon={icon} {...props} />}
				/>
			</TableCell>
		</TableRow>
	);
};

export default DevicesRow;
