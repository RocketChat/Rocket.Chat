import { TableRow, TableCell, Icon, Box, Menu, Option } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useRoute, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, ReactElement, FC, useMemo, useCallback } from 'react';

import GenericModal from '../../../../../client/components/GenericModal';
import { useEndpointAction } from '../../../../../client/hooks/useEndpointAction';
import { useFormatDateAndTime } from '../../../../../client/hooks/useFormatDateAndTime';

type DeviceRowProps = {
	_id: string;
	username: string;
	ip: string;
	deviceName: string;
	deviceType: string;
	deviceOSName: string;
	loginAt: string;
	onReload: () => void;
};

const iconMap: Record<string, ComponentProps<typeof Icon>['name']> = {
	browser: 'desktop',
	mobile: 'mobile',
};

const DeviceIcon: FC<{ deviceType: string }> = ({ deviceType }) => (
	<Box is='span' p='x4' bg='neutral-500-50' borderRadius='x32' mie='x4'>
		<Icon name={iconMap[deviceType]} size='x20' color='info' />
	</Box>
);

const DevicesRow = ({ _id, username, ip, deviceName, deviceType, deviceOSName, loginAt, onReload }: DeviceRowProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const deviceManagementRouter = useRoute('device-management');
	const formatDateAndTime = useFormatDateAndTime();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const handleClick = (): void => {
		deviceManagementRouter.push({
			context: 'info',
			id: _id,
		});
	};

	const logoutDevice = useEndpointAction(
		'POST',
		'sessions/logout',
		useMemo(() => ({ sessionId: _id }), [_id]),
	);

	const handleLogoutDeviceModal = useCallback(() => {
		const closeModal = (): void => setModal(null);

		const handleLogoutDevice = async (): void => {
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
				title={'Logout Device'}
				variant='danger'
				confirmText={'Logout Device'}
				cancelText={t('Cancel')}
				onConfirm={handleLogoutDevice}
				onCancel={closeModal}
				onClose={closeModal}
			>
				{t('Device_Logout_Text')}
			</GenericModal>,
		);
	}, [t, onReload,logoutDevice, setModal, dispatchToastMessage]);

	return (
		<TableRow key={_id} onClick={handleClick} tabIndex={0}>
			<TableCell>
				<DeviceIcon deviceType={deviceType} />
				{deviceName}
			</TableCell>
			<TableCell>{deviceOSName}</TableCell>
			<TableCell withTruncatedText>{username}</TableCell>
			{mediaQuery && <TableCell>{formatDateAndTime(loginAt)}</TableCell>}
			{mediaQuery && <TableCell withTruncatedText>{_id}</TableCell>}
			{mediaQuery && <TableCell>{ip}</TableCell>}
			<TableCell onClick={(e): void => e.stopPropagation()}>
				<Menu
					title={t('Options')}
					options={{
						logout: {
							label: { label: t('Logout_Device'), icon: 'sign-out' },
							action: (): void => handleLogoutDeviceModal(),
						},
					}}
					tabIndex={-1}
					renderItem={({ label: { label, icon }, ...props }): ReactElement => <Option label={label} icon={icon} {...props} />}
				/>
			</TableCell>
		</TableRow>
	);
};

export default DevicesRow;
