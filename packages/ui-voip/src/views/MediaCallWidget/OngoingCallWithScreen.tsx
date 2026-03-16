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
	useInfoSlots,
	CardWidgetContainer,
	StreamCard,
} from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import { usePlayMediaStream } from '../../providers/usePlayMediaStream';

const OngoingCall = () => {
	const { t } = useTranslation();

	const {
		sessionState,
		onMute,
		onHold,
		onForward,
		onEndCall,
		onClickDirectMessage,
		streams,
		onToggleScreenSharing,
		widgetPositionTracker,
	} = useMediaCallView();
	const { muted, held, remoteMuted, remoteHeld, peerInfo, connectionState, startedAt } = sessionState;

	const { localScreen, remoteScreen } = streams;

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
		<Widget restorePosition={widgetPositionTracker?.getRestorePosition()} onChangePosition={widgetPositionTracker?.onChangePosition}>
			<WidgetHandle />
			<WidgetHeader title={connecting ? t('meteor_status_connecting') : <Timer startAt={startedAt} />}>
				{onClickDirectMessage && (
					<ActionButton tiny secondary={false} label={t('Direct_Message')} icon='balloon' onClick={onClickDirectMessage} />
				)}
				<DevicePicker />
			</WidgetHeader>
			<WidgetContent>
				<CardWidgetContainer>
					<PeerInfo {...peerInfo} slots={remoteSlots} remoteMuted={remoteMuted} />

					{remoteScreen?.active && (
						<StreamCard autoHeight maxHeight={120}>
							<video preload='metadata' style={{ objectFit: 'contain', height: '100%', width: '100%' }} ref={remoteStreamRefCallback}>
								<track kind='captions' />
							</video>
						</StreamCard>
					)}
					{localScreen?.active && (
						<Box display='flex' flexDirection='column'>
							<StreamCard own autoHeight maxHeight={120} onClickStopSharing={onToggleScreenSharing}>
								<video preload='metadata' style={{ objectFit: 'contain', height: '100%', width: '100%' }} ref={localStreamRefCallback}>
									<track kind='captions' />
								</video>
							</StreamCard>
							<WidgetInfo slots={[{ text: t('You_are_sharing_your_screen'), type: 'warning' }]} variant='card-content' />
						</Box>
					)}
				</CardWidgetContainer>
			</WidgetContent>
			<WidgetInfo slots={slots} />
			<WidgetFooter>
				<ButtonGroup large>
					<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />

					<ToggleButton
						label={t('Hold')}
						icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
						titles={[t('Hold'), t('Resume')]}
						pressed={held}
						onToggle={onHold}
					/>
					<ToggleButton
						label={t('Share_screen')}
						icons={['desktop-arrow-up', 'desktop-cross']}
						titles={[t('Share_screen'), t('Stop_sharing_screen')]}
						pressed={localScreen?.active ?? false}
						onToggle={onToggleScreenSharing}
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
