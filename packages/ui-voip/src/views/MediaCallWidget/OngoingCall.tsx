import { ButtonGroup, Divider } from '@rocket.chat/fuselage';
import { ActionButton, ToggleButton } from '@rocket.chat/ui-media';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Dialpad from './Dialpad';
import {
	PeerInfo,
	Widget,
	WidgetFooter,
	WidgetHandle,
	WidgetHeader,
	WidgetContent,
	WidgetInfo,
	Timer,
	DevicePicker,
	useInfoSlots,
	useDraggableWidget,
	VideoCallWidgetAction,
} from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import AppActions from '../../experimental/AppActionButtons/components/AppActions';
import { useVisibleAppActions } from '../../experimental/AppActionButtons/hooks/useVisibleAppActions';
import { isUnknownPeer } from '../../utils/isUnknownPeer';

const OngoingCall = () => {
	const { t } = useTranslation();

	const { sessionState, isRequestingVideoCall, onRequestVideoCall, onMute, onHold, onForward, onEndCall, onClickDirectMessage } =
		useMediaCallView();
	const { muted, held, remoteMuted, remoteHeld, peerInfo, connectionState, supportedFeatures, startedAt, escalated } = sessionState;
	const isInline = !useDraggableWidget();

	// The floating widget keeps a collapsible DTMF dialpad in the footer.
	// The inline (sidebar rail) dialpad is permanently expanded in the content instead,
	// so the toggle is only shown while floating to avoid showing both.
	const [dialpadOpen, setDialpadOpen] = useState(false);

	const slots = useInfoSlots(muted, held, connectionState);
	const remoteSlots = useInfoSlots(remoteMuted, remoteHeld);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	const holdAvailable = supportedFeatures.includes('hold');
	const transferAvailable = supportedFeatures.includes('transfer');
	const videoConfAvailable = supportedFeatures.includes('conference-escalation');

	const appActions = useVisibleAppActions();

	const isSip = peerInfo?.type === 'sip';

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={connecting ? t('meteor_status_connecting') : <Timer startAt={startedAt} />}>
				{onClickDirectMessage && (
					<ActionButton tiny secondary={false} label={t('Direct_Message')} icon='balloon' onClick={onClickDirectMessage} />
				)}
				<DevicePicker />
			</WidgetHeader>
			<WidgetContent>
				{peerInfo && !isUnknownPeer(peerInfo) && <PeerInfo {...peerInfo} slots={remoteSlots} remoteMuted={remoteMuted} />}
				{isInline && isSip && <Dialpad autoFocus={false} />}
				{videoConfAvailable && <VideoCallWidgetAction escalated={escalated} loading={isRequestingVideoCall} onClick={onRequestVideoCall} />}
			</WidgetContent>
			<WidgetInfo slots={slots} />
			<WidgetFooter>
				{!isInline && dialpadOpen && <Dialpad />}
				<AppActions actions={appActions} vertical />
				{appActions.length > 0 && <Divider />}
				<ButtonGroup large>
					{!isInline && (
						<ActionButton
							disabled={connecting || reconnecting}
							icon='dialpad'
							label={t('Dialpad')}
							title={dialpadOpen ? t('Close_dialpad') : t('Open_dialpad')}
							onClick={() => setDialpadOpen((open) => !open)}
						/>
					)}
					<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />
					{holdAvailable && (
						<ToggleButton
							label={t('Hold')}
							icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
							titles={[t('Hold'), t('Resume')]}
							pressed={held}
							onToggle={onHold}
							disabled={connecting || reconnecting}
						/>
					)}
					{transferAvailable && (
						<ActionButton disabled={connecting || reconnecting} label={t('Forward')} icon='arrow-forward' onClick={onForward} />
					)}
					<ActionButton
						label={t('Voice_call__user__hangup', {
							user: (peerInfo && (peerInfo.displayName || ('number' in peerInfo && peerInfo.number))) || t('Unknown'),
						})}
						icon='phone-off'
						danger
						onClick={onEndCall}
					/>
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default OngoingCall;
