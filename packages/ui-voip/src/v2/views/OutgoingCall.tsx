import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useMediaCallContext } from '../MediaCallContext';
import { PeerInfo, Widget, WidgetFooter, WidgetHandle, WidgetHeader, WidgetContent, DevicePicker } from '../components';

const OutgoingCall = () => {
	const { t } = useTranslation();

	const { onEndCall, peerInfo } = useMediaCallContext();

	// TODO: Figure out how to ensure this always exist before rendering the component
	if (!peerInfo) {
		throw new Error('Peer info is required');
	}

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={`${t('Calling')}...`}>
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
