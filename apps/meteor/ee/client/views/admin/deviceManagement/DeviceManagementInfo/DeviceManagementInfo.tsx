import { DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, StatusBullet } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback } from 'react';

import InfoPanel from '../../../../../../client/components/InfoPanel';
import VerticalBar from '../../../../../../client/components/VerticalBar';
import UserAvatar from '../../../../../../client/components/avatar/UserAvatar';
import { useFormatDateAndTime } from '../../../../../../client/hooks/useFormatDateAndTime';
import { usePresence } from '../../../../../../client/hooks/usePresence';
import { useDeviceLogout } from '../../../../hooks/useDeviceLogout';

type DeviceManagementInfoProps = DeviceManagementPopulatedSession & {
	onReload: () => void;
};

const DeviceManagementInfo = ({ device, sessionId, loginAt, ip, userId, _user, onReload }: DeviceManagementInfoProps): ReactElement => {
	const t = useTranslation();
	const deviceManagementRouter = useRoute('device-management');
	const formatDateAndTime = useFormatDateAndTime();

	const handleDeviceLogout = useDeviceLogout(sessionId, '/v1/sessions/logout');

	const { name: clientName, os } = device || {};
	const { username, name } = _user || {};
	const userPresence = usePresence(userId);

	const handleCloseContextualBar = useCallback((): void => deviceManagementRouter.push({}), [deviceManagementRouter]);

	return (
		<VerticalBar>
			<VerticalBar.Header>
				{t('Device_Info')}
				<VerticalBar.Close onClick={handleCloseContextualBar} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<InfoPanel>
					<InfoPanel.Field>
						<InfoPanel.Label>{t('Client')}</InfoPanel.Label>
						<InfoPanel.Text>{clientName}</InfoPanel.Text>
					</InfoPanel.Field>

					<InfoPanel.Field>
						<InfoPanel.Label>{t('OS')}</InfoPanel.Label>
						<InfoPanel.Text>{`${os?.name || ''} ${os?.version || ''}`}</InfoPanel.Text>
					</InfoPanel.Field>

					{username && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('User')}</InfoPanel.Label>
							<Box>
								<UserAvatar username={username} etag={userPresence?.avatarETag} />
								<Box is='span' pi='x8'>
									<StatusBullet status={userPresence?.status} />
								</Box>
								{name && <Box is='span'>{name}</Box>}
								<Box is='span' color='gray'>
									{`(${username})`}
								</Box>
							</Box>
						</InfoPanel.Field>
					)}

					<InfoPanel.Field>
						<InfoPanel.Label>{t('Last_login')}</InfoPanel.Label>
						<InfoPanel.Text>{formatDateAndTime(loginAt)}</InfoPanel.Text>
					</InfoPanel.Field>

					<InfoPanel.Field>
						<InfoPanel.Label>{t('Device_ID')}</InfoPanel.Label>
						<InfoPanel.Text>{sessionId}</InfoPanel.Text>
					</InfoPanel.Field>

					<InfoPanel.Field>
						<InfoPanel.Label>{t('IP_Address')}</InfoPanel.Label>
						<InfoPanel.Text>{ip}</InfoPanel.Text>
					</InfoPanel.Field>
				</InfoPanel>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button primary onClick={(): void => handleDeviceLogout(onReload)}>
						{t('Logout_Device')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</VerticalBar>
	);
};

export default DeviceManagementInfo;
