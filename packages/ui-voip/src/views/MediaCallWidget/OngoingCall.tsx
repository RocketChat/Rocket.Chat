import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

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
	useKeypad,
	useInfoSlots,
} from '../../components';
import { useMediaCallInstance } from '../../context/MediaCallInstanceContext';
import { useMediaCallView } from '../../context/MediaCallViewContext';

const OngoingCall = () => {
	const { t } = useTranslation();

	const { instance } = useMediaCallInstance();
	const videoRef = useRef<HTMLVideoElement | null>(null);

	const { sessionState, onMute, onHold, onForward, onEndCall, onTone, onClickDirectMessage, onToggleScreenShare } = useMediaCallView();
	const { muted, held, remoteMuted, remoteHeld, peerInfo, connectionState, screenSharing, remoteScreenSharing } = sessionState;

	const { element: keypad, buttonProps: keypadButtonProps } = useKeypad(onTone);

	const slots = useInfoSlots(muted, held, connectionState);
	const remoteSlots = useInfoSlots(remoteMuted, remoteHeld);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	useEffect(() => {
		if (!remoteScreenSharing) {
			return;
		}

		const node = videoRef.current;
		const stream = instance?.getMainCall()?.getRemoteMediaStream()?.stream || null;

		if (!node || !stream) {
			return;
		}

		node.srcObject = stream;
		node.play().catch((error) => {
			console.error('MediaCall: OngoingCall - Error playing screen share stream', error);
		});

		return () => {
			node.pause();
			node.srcObject = null;
		};
	}, [instance, remoteScreenSharing]);

	// TODO: Figure out how to ensure this always exist before rendering the component
	if (!peerInfo) {
		throw new Error('Peer info is required');
	}

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={connecting ? t('meteor_status_connecting') : <Timer />}>
				{onClickDirectMessage && (
					<ActionButton tiny secondary={false} label={t('Direct_Message')} icon='balloon' onClick={onClickDirectMessage} />
				)}
				<DevicePicker />
			</WidgetHeader>
			<WidgetContent>
				{remoteScreenSharing && (
					<Box mbe={12}>
						<video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: 140, backgroundColor: 'black', borderRadius: 4 }}>
							<track kind='captions' />
						</video>
					</Box>
				)}
				<PeerInfo {...peerInfo} slots={remoteSlots} remoteMuted={remoteMuted} />
			</WidgetContent>
			<WidgetInfo slots={slots} />
			<WidgetFooter>
				{keypad}
				<ButtonGroup large>
					<ActionButton disabled={connecting || reconnecting} icon='dialpad' label='Dialpad' {...keypadButtonProps} />
					<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />
					<ToggleButton
						label={t('Hold')}
						icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
						titles={[t('Hold'), t('Resume')]}
						pressed={held}
						onToggle={onHold}
					/>
					<ToggleButton
						disabled={connecting || reconnecting}
						label={t('Share_screen')}
						icons={['video', 'video-off']}
						titles={[t('Share_screen'), t('Stop_sharing')]}
						pressed={screenSharing}
						onToggle={onToggleScreenShare}
					/>
					<ActionButton disabled={connecting || reconnecting} label={t('Forward')} icon='arrow-forward' onClick={onForward} />
					<ActionButton
						label={t('Voice_call__user__hangup', { user: 'userId' in peerInfo ? peerInfo.displayName : peerInfo.number })}
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
