import { DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';
import { Box, Button, StatusBullet } from '@rocket.chat/fuselage';
import { useRoute, useTranslation, useToastMessageDispatch, useSetModal } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback, useMemo } from 'react';

import GenericModal from '../../../../../client/components/GenericModal';
import VerticalBar from '../../../../../client/components/VerticalBar';
import UserAvatar from '../../../../../client/components/avatar/UserAvatar';
import { useEndpointAction } from '../../../../../client/hooks/useEndpointAction';
import { useFormatDateAndTime } from '../../../../../client/hooks/useFormatDateAndTime';
import { usePresence } from '../../../../../client/hooks/usePresence';
import InfoPanel from '../../../../../client/views/InfoPanel';

type DeviceInfoContextualBarProps = DeviceManagementPopulatedSession & {
	onReload: () => void;
};

const DeviceInfoContextualBar = ({
	device,
	sessionId,
	loginAt,
	ip,
	userId,
	_user,
	onReload,
}: DeviceInfoContextualBarProps): ReactElement => {
	const t = useTranslation();
	const deviceManagementRouter = useRoute('device-management');
	const formatDateAndTime = useFormatDateAndTime();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const { name: clientName, os } = device || {};
	const { username, name } = _user;
	const userPresence = usePresence(userId);

	const closeContextualBar = useCallback((): void => deviceManagementRouter.push({}), [deviceManagementRouter]);

	const logoutDevice = useEndpointAction(
		'POST',
		'/v1/sessions/logout',
		useMemo(() => ({ sessionId }), [sessionId]),
	);

	const handleLogoutDeviceModal = useCallback(() => {
		const closeModal = (): void => setModal(null);

		const handleLogoutDevice = async (): Promise<void> => {
			try {
				await logoutDevice();
				onReload();
				closeContextualBar();
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
	}, [t, onReload, logoutDevice, setModal, dispatchToastMessage, closeContextualBar]);

	return (
		<VerticalBar>
			<VerticalBar.Header>
				{t('Device_Info')}
				<VerticalBar.Close onClick={closeContextualBar} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent height={'100%'}>
				<InfoPanel>
					<InfoPanel.Field>
						<InfoPanel.Label>{t('Client')}</InfoPanel.Label>
						<InfoPanel.Text>{clientName}</InfoPanel.Text>
					</InfoPanel.Field>

					<InfoPanel.Field>
						<InfoPanel.Label>{t('OS')}</InfoPanel.Label>
						<InfoPanel.Text>{`${os?.name || ''} ${os?.version || ''}`}</InfoPanel.Text>
					</InfoPanel.Field>

					<InfoPanel.Field>
						<InfoPanel.Label>{t('User')}</InfoPanel.Label>
						<Box>
							<UserAvatar username={username || ''} etag={userPresence?.avatarETag} />
							<Box is='span' pi='x8'>
								<StatusBullet status={userPresence?.status} />
							</Box>
							{name && <Box is='span'>{name}</Box>}
							<Box is='span' color='gray'>
								{' '}
								{username && `(${username})`}
							</Box>
						</Box>
					</InfoPanel.Field>

					<InfoPanel.Field>
						<InfoPanel.Label>{t('Last_Login')}</InfoPanel.Label>
						<InfoPanel.Text>{formatDateAndTime(loginAt)}</InfoPanel.Text>
					</InfoPanel.Field>

					<InfoPanel.Field>
						<InfoPanel.Label>{t('Device_Id')}</InfoPanel.Label>
						<InfoPanel.Text>{sessionId}</InfoPanel.Text>
					</InfoPanel.Field>

					<InfoPanel.Field>
						<InfoPanel.Label>{t('IP_Address')}</InfoPanel.Label>
						<InfoPanel.Text>{ip}</InfoPanel.Text>
					</InfoPanel.Field>
				</InfoPanel>

				<VerticalBar.Footer>
					<Button primary width={'100%'} onClick={handleLogoutDeviceModal}>
						{t('Logout_Device')}
					</Button>
				</VerticalBar.Footer>
			</VerticalBar.ScrollableContent>
		</VerticalBar>
	);
};

export default DeviceInfoContextualBar;
