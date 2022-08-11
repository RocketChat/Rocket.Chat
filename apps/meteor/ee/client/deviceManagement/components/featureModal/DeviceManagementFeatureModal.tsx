import { Button, Modal, Icon } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, ReactElement, useMemo } from 'react';

import { useEndpointAction } from '../../../../../client/hooks/useEndpointAction';
import FeatureModalBullets from './FeatureModalBullets';

type bulletOptionType = {
	title: string;
	subtitle: string;
	icon: ComponentProps<typeof Icon>['name'];
};

const documentationURL = 'https://go.rocket.chat/i/device-management';

const DeviceManagementFeatureModal = ({ close }: { close: () => void }): ReactElement => {
	const t = useTranslation();

	const bulletOptions: bulletOptionType[] = useMemo(
		() => [
			{
				title: t('Receive_login_notifications'),
				subtitle: t('Monitor_new_and_suspicious_logins'),
				icon: 'bell',
			},
			{
				title: t('Check_device_activity'),
				subtitle: t('Review_devices'),
				icon: 'computer',
			},
			{
				title: t('Log_out_devices_remotely'),
				subtitle: t('End_suspicious_sessions'),
				icon: 'login',
			},
		],
		[t],
	);

	const modalAcknowledgement = useEndpointAction('POST', '/v1/banners.dismiss', { bannerId: 'device-management' });

	const handleGotit = (): void => {
		modalAcknowledgement();
		close();
	};

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
				<Modal.FooterControllers>
					<ExternalLink to={documentationURL}>{t('Learn_more')}</ExternalLink>
					<Button onClick={handleGotit}>{t('Got_it')}</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default DeviceManagementFeatureModal;
