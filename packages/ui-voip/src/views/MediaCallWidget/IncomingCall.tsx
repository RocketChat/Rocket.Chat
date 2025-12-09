import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { DevicePicker, PeerInfo, Widget, WidgetFooter, WidgetHandle, WidgetHeader, WidgetContent } from '../../components';
import { useMediaCallContext } from '../../context';

const IncomingCall = () => {
	const { t } = useTranslation();

	const { onEndCall, onAccept, peerInfo } = useMediaCallContext();

	// TODO: Figure out how to ensure this always exist before rendering the component
	if (!peerInfo) {
		throw new Error('Peer info is required');
	}

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={`${t('Incoming_call')}...`}>
				<DevicePicker />
			</WidgetHeader>
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

export default IncomingCall;
