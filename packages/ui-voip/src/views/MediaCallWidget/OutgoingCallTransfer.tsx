import { Button, ButtonGroup, Divider } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { PeerInfo, Widget, WidgetFooter, WidgetHandle, WidgetHeader, WidgetContent, DevicePicker, WidgetInfo } from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import AppActions from '../../experimental/AppActionButtons/components/AppActions';
import { useVisibleAppActions } from '../../experimental/AppActionButtons/hooks/useVisibleAppActions';

const OutgoingCallTransfer = () => {
	const { t } = useTranslation();

	const {
		sessionState: { peerInfo, connectionState, transferredBy },
		onEndCall,
	} = useMediaCallView();

	const appActions = useVisibleAppActions();

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
				<AppActions actions={appActions} vertical />
				{appActions.length > 0 && <Divider />}
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
