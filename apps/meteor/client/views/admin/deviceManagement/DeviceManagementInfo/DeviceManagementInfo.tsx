import type { DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, StatusBullet } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useRoute, useUserPresence } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarTitle,
} from '../../../../components/Contextualbar';
import { InfoPanel, InfoPanelField, InfoPanelLabel, InfoPanelText } from '../../../../components/InfoPanel';
import { useDeviceLogout } from '../../../../hooks/useDeviceLogout';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';

type DeviceManagementInfoProps = DeviceManagementPopulatedSession & {
	onReload: () => void;
};

const DeviceManagementInfo = ({ device, sessionId, loginAt, ip, userId, _user, onReload }: DeviceManagementInfoProps): ReactElement => {
	const { t } = useTranslation();
	const deviceManagementRouter = useRoute('device-management');
	const formatDateAndTime = useFormatDateAndTime();

	const handleDeviceLogout = useDeviceLogout(sessionId, '/v1/sessions/logout');

	const { name: clientName, os, version: rcVersion } = device || {};
	const { username, name } = _user || {};
	const userPresence = useUserPresence(userId);

	const handleCloseContextualBar = useCallback((): void => deviceManagementRouter.push({}), [deviceManagementRouter]);

	return (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Device_Info')}</ContextualbarTitle>
				<ContextualbarClose onClick={handleCloseContextualBar} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<InfoPanel>
					<InfoPanelField>
						<InfoPanelLabel>{t('Client')}</InfoPanelLabel>
						<InfoPanelText>{clientName}</InfoPanelText>
					</InfoPanelField>

					<InfoPanelField>
						<InfoPanelLabel>{t('Version')}</InfoPanelLabel>
						<InfoPanelText>{rcVersion || '—'}</InfoPanelText>
					</InfoPanelField>

					<InfoPanelField>
						<InfoPanelLabel>{t('OS')}</InfoPanelLabel>
						<InfoPanelText>{`${os?.name || ''} ${os?.version || ''}`}</InfoPanelText>
					</InfoPanelField>

					{username && (
						<InfoPanelField>
							<InfoPanelLabel>{t('User')}</InfoPanelLabel>
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
						</InfoPanelField>
					)}

					<InfoPanelField>
						<InfoPanelLabel>{t('Last_login')}</InfoPanelLabel>
						<InfoPanelText>{formatDateAndTime(loginAt)}</InfoPanelText>
					</InfoPanelField>

					<InfoPanelField>
						<InfoPanelLabel>{t('Device_ID')}</InfoPanelLabel>
						<InfoPanelText>{sessionId}</InfoPanelText>
					</InfoPanelField>

					<InfoPanelField>
						<InfoPanelLabel>{t('IP_Address')}</InfoPanelLabel>
						<InfoPanelText>{ip}</InfoPanelText>
					</InfoPanelField>
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
