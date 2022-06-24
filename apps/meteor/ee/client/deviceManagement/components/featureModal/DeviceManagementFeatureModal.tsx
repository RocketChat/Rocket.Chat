import React from 'react';
import { Box, Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import FeatureModalBullets from './FeatureModalBullets';

const DeviceManagementFeatureModal = ({ close }: { close: () => void }) => {
	const t = useTranslation();

	const options = [
		{
			title: 'Receive_notifications_about_suspicious_logins',
			subtitle: 'Some descriptive text here some descriptive text here',
			icon: 'bell',
		},
		{
			title: 'Check_your_devices_activity',
			subtitle: 'Some descriptive text here some descriptive text here',
			icon: 'computer',
		},
		{
			title: 'Finish_suspicious_sessions_remotely',
			subtitle: 'Some descriptive text here some descriptive text here',
			icon: 'login',
		},
	];

	return (
			<Modal>
				<Modal.Header>
					{/* <Box display='flex' justifyContent='space-between' alignItems='center'>
						<Box as='span' fontSize='x20'>{t('Workspace_now_using_device_management')}</Box>
					</Box> */}
					<Modal.Title withTruncatedText={false}>{t('Workspace_now_using_device_management')}</Modal.Title>
					<Modal.Close title={t('Close')} onClick={close} />
				</Modal.Header>
				<Modal.Content>
					{options.map(({ title, subtitle, icon }) => (
						<FeatureModalBullets key={title} title={title} subtitle={subtitle} icon={icon} />
					))}
				</Modal.Content>
				<Modal.Footer>
					<Box display='flex' justifyContent='space-between' alignItems='center'>
						<Box>
							<Box is='span'>Learn more in </Box>
							<Box is='a'>Documentation</Box>
						</Box>
						<Button info onClick={close}>
							{t('Got_it')}
						</Button>
					</Box>
				</Modal.Footer>
			</Modal>
	);
};

export default DeviceManagementFeatureModal;
