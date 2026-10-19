import { Button, ButtonGroup, Divider } from '@rocket.chat/fuselage';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { DevicePicker, PeerInfo, Widget, WidgetFooter, WidgetHandle, WidgetHeader, WidgetContent, WidgetInfo } from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import AppActions from '../../experimental/AppActionButtons/components/AppActions';
import { useVisibleAppActions } from '../../experimental/AppActionButtons/hooks/useVisibleAppActions';
import { isUnknownPeer } from '../../utils/isUnknownPeer';

const getHeaderTitle = ({ connecting, transferred, t }: { connecting: boolean; transferred: boolean; t: TFunction }) => {
	if (connecting) {
		return t('meteor_status_connecting');
	}

	if (transferred) {
		return `${t('Transferring_call_incoming')}...`;
	}

	return `${t('Incoming_call')}...`;
};

const IncomingCall = () => {
	const { t } = useTranslation();

	const { sessionState, onEndCall, onAccept } = useMediaCallView();
	const { peerInfo, connectionState, transferredBy } = sessionState;

	const connecting = connectionState === 'CONNECTING';

	const appActions = useVisibleAppActions();

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={getHeaderTitle({ connecting, transferred: !!transferredBy, t })}>
				<DevicePicker />
			</WidgetHeader>
			{transferredBy && <WidgetInfo slots={[{ text: t('Transferring_call_incoming__from_', { from: transferredBy }), type: 'info' }]} />}
			<WidgetContent>{peerInfo && !isUnknownPeer(peerInfo) && <PeerInfo {...peerInfo} />}</WidgetContent>
			<WidgetFooter>
				<AppActions actions={appActions} vertical />
				{appActions.length > 0 && <Divider />}
				<ButtonGroup stretch>
					{connecting ? (
						<Button medium name='phone' icon='phone-off' danger flexGrow={1} onClick={onEndCall}>
							{t('Cancel')}
						</Button>
					) : (
						<>
							<Button medium name='phone' icon='phone-off' danger flexGrow={1} onClick={onEndCall}>
								{t('Reject')}
							</Button>
							<Button medium name='phone' icon='phone' success flexGrow={1} onClick={() => void onAccept()}>
								{t('Accept')}
							</Button>
						</>
					)}
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default IncomingCall;
