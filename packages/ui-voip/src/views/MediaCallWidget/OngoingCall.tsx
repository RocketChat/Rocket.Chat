import { ButtonGroup, Divider } from '@rocket.chat/fuselage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Dialpad from './Dialpad';
import {
	ToggleButton,
	PeerInfo,
	Widget,
	WidgetFooter,
	WidgetHandle,
	WidgetHeader,
	WidgetContent,
	WidgetInfo,
	Timer,
	DevicePicker,
	ActionButton,
	useInfoSlots,
	useDraggableWidget,
	VideoCallWidgetAction,
} from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import AppActions from '../../experimental/AppActionButtons/components/AppActions';
import { useVisibleAppActions } from '../../experimental/AppActionButtons/hooks/useVisibleAppActions';
import { isExternalPeer } from '../../utils/isExternalPeer';

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

	// TODO: Figure out how to ensure this always exist before rendering the component
	if (!peerInfo) {
		throw new Error('Peer info is required');
	}

	const isSip = 'number' in peerInfo;

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
				<PeerInfo {...peerInfo} slots={remoteSlots} remoteMuted={remoteMuted} />
				{isInline && isSip && <Dialpad autoFocus={false} />}
				{videoConfAvailable && <VideoCallWidgetAction escalated={escalated} loading={isRequestingVideoCall} onClick={onRequestVideoCall} />}
			</WidgetContent>
			<WidgetInfo slots={slots} />
			<WidgetFooter>
				{!isInline && dialpadOpen && <Dialpad />}
				<AppActions actions={appActions} vertical />
				{appActions.length > 0 && <Divider />}
				<ButtonGroup large align='center'>
					{!isInline && (
						<ActionButton
							disabled={connecting || reconnecting}
							icon='dialpad'
							label='Dialpad'
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
							user: isExternalPeer(peerInfo) ? peerInfo.displayName || peerInfo.number : peerInfo.displayName,
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
