import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { PeerInfo, Widget, WidgetFooter, WidgetHandle, WidgetHeader, WidgetContent, DevicePicker, WidgetInfo } from '../../components';
import { useMediaCallContext } from '../../context';

const OutgoingCallTransfer = () => {
	const { t } = useTranslation();

	const { onEndCall, peerInfo, connectionState, transferredBy } = useMediaCallContext();

	if (!peerInfo) {
		throw new Error('Peer info is required');
	}

	const connecting = connectionState === 'CONNECTING';

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={connecting ? t('meteor_status_connecting') : `${t('Transferring_call')}...`}>
				<DevicePicker />
			</WidgetHeader>
			{transferredBy && <WidgetInfo slots={[{ text: t('Transferred_call__from__to', { from: transferredBy }), type: 'info' }]} />}
			<WidgetContent>
				<PeerInfo {...peerInfo} />
			</WidgetContent>
			<WidgetFooter>
				<ButtonGroup stretch>
					<Button medium name='phone' icon='phone-off' danger flexGrow={1} onClick={onEndCall}>
						{t('Cancel')}
					</Button>
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default OutgoingCallTransfer;
