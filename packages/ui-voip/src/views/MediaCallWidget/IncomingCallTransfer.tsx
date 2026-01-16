import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { DevicePicker, PeerInfo, Widget, WidgetFooter, WidgetHandle, WidgetHeader, WidgetContent, WidgetInfo } from '../../components';
import { useMediaCallContext } from '../../context';

const IncomingCallTransfer = () => {
	const { t } = useTranslation();

	const { onEndCall, onAccept, peerInfo, transferredBy } = useMediaCallContext();

	if (!peerInfo) {
		throw new Error('Peer info is required');
	}

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={`${t('Transferring_call_incoming')}...`}>
				<DevicePicker />
			</WidgetHeader>
			{transferredBy && <WidgetInfo slots={[{ text: t('Transferring_call_incoming__from_', { from: transferredBy }), type: 'info' }]} />}
			<WidgetContent>
				<PeerInfo {...peerInfo} />
			</WidgetContent>
			<WidgetFooter>
				<ButtonGroup stretch>
					<Button medium name='phone' icon='phone-off' danger flexGrow={1} onClick={onEndCall}>
						{t('Reject')}
					</Button>
					<Button medium name='phone' icon='phone' success flexGrow={1} onClick={() => void onAccept()}>
						{t('Accept')}
					</Button>
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default IncomingCallTransfer;
