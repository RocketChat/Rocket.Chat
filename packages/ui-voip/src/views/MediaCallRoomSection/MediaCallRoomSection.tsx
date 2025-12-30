import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	ToggleButton,
	// PeerInfo,
	// Widget,
	// WidgetFooter,
	// WidgetHandle,
	// WidgetHeader,
	// WidgetContent,
	// WidgetInfo,
	Timer,
	DevicePicker,
	ActionButton,
	// useKeypad,
	// useInfoSlots,
} from '../../components';
import { useMediaCallContext } from '../../context';
import useMediaStream from '../../context/useMediaStream';
import useRoomView from '../../context/useRoomView';

const getSplitStyles = (showChat: boolean) => {
	if (showChat) {
		return {
			maxHeight: '50vh',
			borderBlockEnd: '1px solid',
			borderBlockEndColor: 'stroke-light',
		};
	}
	return {
		height: '100%',
	};
};

const RoomCallSection = ({ showChat, onToggleChat }: { showChat: boolean; onToggleChat: () => void }) => {
	const { t } = useTranslation();
	const [sharingScreen, setSharingScreen] = useState<boolean>(false);
	const {
		muted,
		held,
		// remoteMuted,
		// remoteHeld,
		onMute,
		onHold,
		onForward,
		onEndCall,
		// onTone,
		peerInfo,
		connectionState,
		// expanded,
		// getRemoteStream,
		getRemoteVideoStream,
		toggleScreenSharing,
	} = useMediaCallContext();

	// const { element: keypad, buttonProps: keypadButtonProps } = useKeypad(onTone);

	// const slots = useInfoSlots(muted, held, connectionState);
	// const remoteSlots = useInfoSlots(remoteMuted, remoteHeld);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	const remoteVideoStream = getRemoteVideoStream();

	const [remoteStreamRefCallback] = useMediaStream(remoteVideoStream);

	const onVideoPlaying = useRoomView();

	const onClickShareScreen = () => {
		toggleScreenSharing();
		setSharingScreen((prev) => !prev);
	};

	// TODO: Figure out how to ensure this always exist before rendering the component
	if (!peerInfo) {
		return null;
		// throw new Error('Peer info is required');
	}

	return (
		<Box
			w='full'
			bg='hover'
			flexShrink={0}
			borderBlockEnd='1px solid'
			borderBlockEndColor='stroke-light'
			overflow='hidden'
			display='flex'
			flexDirection='column'
			justifyContent='space-between'
			alignItems='center'
			{...getSplitStyles(showChat)}
		>
			{/* <Box flexShrink={0}>
				<PeerInfo {...peerInfo} slots={remoteSlots} remoteMuted={remoteMuted} />
				<Timer />
			</Box> */}
			{remoteVideoStream && (
				<Box flexGrow={1} flexShrink={1} overflow='hidden' alignItems='center' justifyContent='center' pb={8} pi={8}>
					<video
						preload='metadata'
						style={{ height: '100%', width: '100%', objectFit: 'contain' }}
						ref={remoteStreamRefCallback}
						onPlaying={onVideoPlaying}
					>
						<track kind='captions' />
					</video>
				</Box>
			)}
			<Box display='flex' flexDirection='row' justifyContent='space-between' flexShrink={0} mb={8} w='full'>
				<Box flexGrow={1} color='default' alignContent='center' pis={16}>
					<Timer />
				</Box>
				<ButtonGroup large align='center' style={{ flexGrow: 2 }}>
					{/* <ActionButton disabled={connecting || reconnecting} icon='dialpad' label='Dialpad' {...keypadButtonProps} /> */}
					<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />
					<ToggleButton
						label={t('Screen_sharing')}
						icons={['computer', 'computer']}
						titles={[t('Screen_sharing'), t('Screen_sharing_off')]}
						pressed={sharingScreen}
						onToggle={onClickShareScreen}
					/>
					<ToggleButton
						label={t('Hold')}
						icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
						titles={[t('Hold'), t('Resume')]}
						pressed={held}
						onToggle={onHold}
					/>
					{remoteVideoStream && (
						<ToggleButton
							label={t('Chat')}
							icons={['balloon', 'balloon-off']}
							titles={[t('Open_chat'), t('Close_chat')]}
							pressed={showChat}
							onToggle={onToggleChat}
						/>
					)}
					<ActionButton disabled={connecting || reconnecting} label={t('Forward')} icon='arrow-forward' onClick={onForward} />
					<ActionButton
						label={t('Voice_call__user__hangup', { user: 'userId' in peerInfo ? peerInfo.displayName : peerInfo.number })}
						icon='phone-off'
						danger
						onClick={onEndCall}
					/>
					<DevicePicker />
				</ButtonGroup>
				<Box flexGrow={1} /> {/* TODO: This is a hack to center the buttons */}
			</Box>
		</Box>
	);
};

export default memo(RoomCallSection);
