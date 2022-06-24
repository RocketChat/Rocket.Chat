import { Box, Button, Modal, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, ReactElement, useMemo } from 'react';

import FeatureModalBullets from './FeatureModalBullets';

type bulletOptionType = {
	title: string;
	subtitle: string;
	icon: ComponentProps<typeof Icon>['name'];
};

const DeviceManagementFeatureModal = ({ close }: { close: () => void }): ReactElement => {
	const t = useTranslation();

	const bulletOptions: bulletOptionType[] = useMemo(
		() => [
			{
				title: t('Receive_notifications_about_suspicious_logins'),
				subtitle: 'Some descriptive text here some descriptive text here',
				icon: 'bell',
			},
			{
				title: t('Check_your_devices_activity'),
				subtitle: 'Some descriptive text here some descriptive text here',
				icon: 'computer',
			},
			{
				title: t('Finish_suspicious_sessions_remotely'),
				subtitle: 'Some descriptive text here some descriptive text here',
				icon: 'login',
			},
		],
		[t],
	);

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title withTruncatedText={false}>{t('Workspace_now_using_device_management')}</Modal.Title>
				<Modal.Close title={t('Close')} onClick={close} />
			</Modal.Header>
			<Modal.Content>
				{bulletOptions.map(({ title, subtitle, icon }, index) => (
					<FeatureModalBullets key={index} title={title} subtitle={subtitle} icon={icon} />
				))}
			</Modal.Content>
			<Modal.Footer>
				<Box display='flex' justifyContent='space-between' alignItems='center'>
					<Box>
						<Box is='span'>{t('Learn_More_In')} </Box>
						<Box is='a' target='_blank' rel='noopener noreferrer'>
							{t('Documentation')}
						</Box>
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
