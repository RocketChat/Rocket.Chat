import { Button, TableRow, TableCell } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback, useMemo } from 'react';

import GenericModal from '../../../../../client/components/GenericModal';
import { useEndpointAction } from '../../../../../client/hooks/useEndpointAction';
import { useFormatDateAndTime } from '../../../../../client/hooks/useFormatDateAndTime';

type DevicesRowProps = {
	_id: string;
	deviceName: string;
	deviceType: string;
	deviceOSName: string;
	deviceOSVersion: string;
	loginAt: string;
	onReload: () => void;
};

const DevicesRow = ({ _id, deviceName, deviceOSName, deviceOSVersion, loginAt, onReload }: DevicesRowProps): ReactElement => {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const logoutDevice = useEndpointAction(
		'POST',
		'sessions/logout.me',
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
	}, [t, onReload, logoutDevice, setModal, dispatchToastMessage]);

	return (
		<TableRow key={_id}>
			<TableCell>{deviceName}</TableCell>
			<TableCell>{`${deviceOSName} ${deviceOSVersion}`}</TableCell>
			<TableCell>{formatDateAndTime(loginAt)}</TableCell>
			{mediaQuery && <TableCell>{_id}</TableCell>}
			<TableCell align='end'>
				<Button onClick={handleLogoutDeviceModal}>{t('Logout')}</Button>
			</TableCell>
		</TableRow>
	);
};

export default DevicesRow;
