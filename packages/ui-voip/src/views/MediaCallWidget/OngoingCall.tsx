import { Box, ButtonGroup } from '@rocket.chat/fuselage';
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
import { useMediaCallContext } from '../../context';
import useMediaStream from '../../context/useMediaStream';

const OngoingCall = () => {
	const { t } = useTranslation();

	const {
		muted,
		held,
		remoteMuted,
		remoteHeld,
		onMute,
		onHold,
		onForward,
		onEndCall,
		onTone,
		peerInfo,
		connectionState,
		getRemoteVideoStream,
		toggleScreenSharing,
		onClickDirectMessage,
	} = useMediaCallContext();

	const { element: keypad, buttonProps: keypadButtonProps } = useKeypad(onTone);

	const slots = useInfoSlots(muted, held, connectionState);
	const remoteSlots = useInfoSlots(remoteMuted, remoteHeld);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	const videoStreamWrapper = getRemoteVideoStream();

	const [remoteVideoStreamRefCallback] = useMediaStream(videoStreamWrapper?.stream ?? null);

	const onClickShareScreen = () => {
		toggleScreenSharing();
	};

	// TODO: Figure out how to ensure this always exist before rendering the component
	if (!peerInfo) {
		throw new Error('Peer info is required');
	}

	return (
		<Widget expanded={videoStreamWrapper?.active}>
			<WidgetHandle />
			<WidgetHeader title={connecting ? t('meteor_status_connecting') : <Timer />}>
				{onClickDirectMessage && (
					<ActionButton tiny secondary={false} label={t('Direct_Message')} icon='balloon' onClick={onClickDirectMessage} />
				)}
				<DevicePicker />
			</WidgetHeader>
			<WidgetContent>
				<PeerInfo {...peerInfo} slots={remoteSlots} remoteMuted={remoteMuted} />
				{videoStreamWrapper?.active && (
					<Box display='flex' flexDirection='column' w={432} h={243}>
						<video controls preload='metadata' style={{ width: '100%', height: '100%' }} ref={remoteVideoStreamRefCallback}>
							<track kind='captions' />
						</video>
					</Box>
				)}
			</WidgetContent>
			<WidgetInfo slots={slots} />
			<WidgetFooter>
				{keypad}
				<ButtonGroup large align='center'>
					<ActionButton disabled={connecting || reconnecting} icon='dialpad' label='Dialpad' {...keypadButtonProps} />
					<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />
					<ToggleButton
						label={t('Screen_sharing')}
						icons={['computer', 'computer']}
						titles={[t('Screen_sharing'), t('Screen_sharing_off')]}
						pressed={videoStreamWrapper?.active ?? false}
						onToggle={onClickShareScreen}
					/>
					<ToggleButton
						label={t('Hold')}
						icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
						titles={[t('Hold'), t('Resume')]}
						pressed={held}
						onToggle={onHold}
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
