import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { PeerInfo, Widget, WidgetFooter, WidgetHandle, WidgetHeader, WidgetContent, DevicePicker, WidgetInfo } from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import { isUnknownPeer } from '../../utils/isUnknownPeer';

const getHeaderTitle = ({ connecting, transferred, t }: { connecting: boolean; transferred: boolean; t: TFunction }) => {
	if (connecting) {
		return t('meteor_status_connecting');
	}

	if (transferred) {
		return `${t('Transferring_call')}...`;
	}

	return `${t('Calling')}...`;
};

const OutgoingCall = () => {
	const { t } = useTranslation();

	const { sessionState, onEndCall } = useMediaCallView();
	const { peerInfo, connectionState, transferredBy } = sessionState;

	const connecting = connectionState === 'CONNECTING';

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={getHeaderTitle({ connecting, transferred: !!transferredBy, t })}>
				<DevicePicker />
			</WidgetHeader>
			{transferredBy && <WidgetInfo slots={[{ text: t('Transferred_call__from__to', { from: transferredBy }), type: 'info' }]} />}
			<WidgetContent>{peerInfo && !isUnknownPeer(peerInfo) && <PeerInfo {...peerInfo} />}</WidgetContent>
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

export default OutgoingCall;
