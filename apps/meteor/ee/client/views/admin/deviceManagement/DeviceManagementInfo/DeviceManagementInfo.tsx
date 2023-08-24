import type { DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, StatusBullet } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarTitle,
} from '../../../../../../client/components/Contextualbar';
import InfoPanel from '../../../../../../client/components/InfoPanel';
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

	const { name: clientName, os, version: rcVersion } = device || {};
	const { username, name } = _user || {};
	const userPresence = usePresence(userId);

	const handleCloseContextualBar = useCallback((): void => deviceManagementRouter.push({}), [deviceManagementRouter]);

	return (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Device_Info')}</ContextualbarTitle>
				<ContextualbarClose onClick={handleCloseContextualBar} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<InfoPanel>
					<InfoPanel.Field>
						<InfoPanel.Label>{t('Client')}</InfoPanel.Label>
						<InfoPanel.Text>{clientName}</InfoPanel.Text>
					</InfoPanel.Field>

					<InfoPanel.Field>
						<InfoPanel.Label>{t('Version')}</InfoPanel.Label>
						<InfoPanel.Text>{rcVersion || '—'}</InfoPanel.Text>
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
								<Box is='span' pi={8}>
									<StatusBullet status={userPresence?.status} />
								</Box>
								{name && <Box is='span'>{name}</Box>}
								<Box is='span' color='hint'>
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
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button primary onClick={(): void => handleDeviceLogout(onReload)}>
						{t('Logout_Device')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</Contextualbar>
	);
};

export default DeviceManagementInfo;
