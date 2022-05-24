import React, { ReactElement } from 'react';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import VerticalBar from '/client/components/VerticalBar';
import InfoPanel from '/client/views/InfoPanel';
import UserAvatar from '/client/components/avatar/UserAvatar';
import { usePresence } from '/client/hooks/usePresence';
import { Box, Button, StatusBullet } from '@rocket.chat/fuselage';
import { useFormatDateAndTime } from '../../../../../client/hooks/useFormatDateAndTime';

const DeviceInfoContextualBar = ({ device: { name: clientName, os: { name: OSName, version }}, sessionId, loginAt, ip }: any): ReactElement => {

	const t = useTranslation();
	const deviceManagementRouter = useRoute('device-management');
	const formatDateAndTime = useFormatDateAndTime();

	const userPresence = usePresence('jurWMxNiyN3bzHDNk');

	const handleLogoutDevice = () => {
		console.log("Logout");
	}

	return (
		<VerticalBar>
			<VerticalBar.Header>
				{t('Device_Info')}
				<VerticalBar.Close onClick={() => deviceManagementRouter.push({})} />
			</VerticalBar.Header>
		<VerticalBar.ScrollableContent height={'100%'}>
			<InfoPanel>
				<InfoPanel.Field>
					<InfoPanel.Label>{t('Client')}</InfoPanel.Label>
					<InfoPanel.Text>{clientName}</InfoPanel.Text>
				</InfoPanel.Field>

				<InfoPanel.Field>
					<InfoPanel.Label>{t('OS')}</InfoPanel.Label>
					<InfoPanel.Text>{`${OSName} ${version}`}</InfoPanel.Text>
				</InfoPanel.Field>

				<InfoPanel.Field>
					<InfoPanel.Label>{t('User')}</InfoPanel.Label>
					<Box>
						<UserAvatar username={'yash'} />
						<Box is='span' pi='x8'><StatusBullet status={userPresence?.status} /></Box>
						<Box is='span'>{'Test User Full Name'}</Box>
						<Box is='span' color='gray'> ({'Test-Username'})</Box>
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
				<Button primary width={'100%'} onClick={handleLogoutDevice}>
					{t('Logout_Device')}
				</Button>
			</VerticalBar.Footer>
		</VerticalBar.ScrollableContent>
		</VerticalBar>
	);
};

export default DeviceInfoContextualBar;
