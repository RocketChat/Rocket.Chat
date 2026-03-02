import { ButtonGroup } from '@rocket.chat/fuselage';
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
import StreamCard from '../../components/Cards/StreamCard';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import { usePlayMediaStream } from '../../providers/usePlayMediaStream';

const OngoingCall = () => {
	const { t } = useTranslation();

	const { sessionState, onMute, onHold, onForward, onEndCall, onTone, onClickDirectMessage, streams, onToggleScreenSharing } =
		useMediaCallView();
	const { muted, held, remoteMuted, remoteHeld, peerInfo, connectionState } = sessionState;

	const { localScreen, remoteScreen } = streams;

	const { element: keypad, buttonProps: keypadButtonProps } = useKeypad(onTone);

	const [remoteStreamRefCallback] = usePlayMediaStream(remoteScreen?.stream ?? null);
	const [localStreamRefCallback] = usePlayMediaStream(localScreen?.stream ?? null);

	const slots = useInfoSlots(muted, held, connectionState);
	const remoteSlots = useInfoSlots(remoteMuted, remoteHeld);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

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
				<PeerInfo {...peerInfo} slots={remoteSlots} remoteMuted={remoteMuted} />
				{/* TODO: Cannot get user info right here, I'm avoiding to other contexts, so it has to come from VoipContext */}
				{localScreen?.active && (
					<StreamCard displayName={t('You')} own autoHeight maxHeight={120}>
						<video preload='metadata' style={{ objectFit: 'contain', height: '100%', width: '100%' }} ref={localStreamRefCallback}>
							<track kind='captions' />
						</video>
					</StreamCard>
				)}
				{remoteScreen?.active && (
					<StreamCard displayName={'displayName' in peerInfo ? peerInfo.displayName : ''} autoHeight maxHeight={120}>
						<video preload='metadata' style={{ objectFit: 'contain', height: '100%', width: '100%' }} ref={remoteStreamRefCallback}>
							<track kind='captions' />
						</video>
					</StreamCard>
				)}
			</WidgetContent>
			<WidgetInfo slots={slots} />
			<WidgetFooter>
				{keypad}
				<ButtonGroup large>
					{'number' in peerInfo && (
						<ActionButton disabled={connecting || reconnecting} icon='dialpad' label='Dialpad' {...keypadButtonProps} />
					)}
					<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />

					<ToggleButton
						label={t('Hold')}
						icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
						titles={[t('Hold'), t('Resume')]}
						pressed={held}
						onToggle={onHold}
					/>
					{'username' in peerInfo && (
						<ToggleButton
							label={t('Screen_sharing')}
							icons={['computer', 'computer']}
							titles={[t('Screen_sharing'), t('Screen_sharing_off')]}
							pressed={localScreen?.active ?? false}
							onToggle={onToggleScreenSharing}
						/>
					)}
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
