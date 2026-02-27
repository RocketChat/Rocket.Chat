import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { PeerInfo, Widget, WidgetFooter, WidgetHandle, WidgetHeader, WidgetContent, DevicePicker } from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';

const OutgoingCall = () => {
	const { t } = useTranslation();

	const { sessionState, onEndCall } = useMediaCallView();
	const { peerInfo, connectionState } = sessionState;

	// TODO: Figure out how to ensure this always exist before rendering the component
	if (!peerInfo) {
		throw new Error('Peer info is required');
	}

	const connecting = connectionState === 'CONNECTING';

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={connecting ? t('meteor_status_connecting') : `${t('Calling')}...`}>
				<DevicePicker />
			</WidgetHeader>
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

export default OutgoingCall;
