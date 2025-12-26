import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	ToggleButton,
	PeerInfo,
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
	useInfoSlots,
} from '../../components';
import { useMediaCallContext } from '../../context';
import useMediaStream from '../../context/useMediaStream';

const RoomCallSection = () => {
	const { t } = useTranslation();

	const [sharingScreen, setSharingScreen] = useState<boolean>(false);
	const {
		muted,
		held,
		remoteMuted,
		remoteHeld,
		onMute,
		onHold,
		onForward,
		onEndCall,
		// onTone,
		peerInfo,
		connectionState,
		// expanded,
		getRemoteStream,
		toggleScreenSharing,
	} = useMediaCallContext();

	// const { element: keypad, buttonProps: keypadButtonProps } = useKeypad(onTone);

	// const slots = useInfoSlots(muted, held, connectionState);
	const remoteSlots = useInfoSlots(remoteMuted, remoteHeld);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	const [remoteStreamRefCallback] = useMediaStream(getRemoteStream());

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
			maxHeight='50vh'
			w='full'
			bg='hover'
			flexShrink={0}
			borderBlockEnd='1px solid'
			borderBlockEndColor='stroke-light'
			display='flex'
			flexDirection='column'
			justifyContent='space-between'
		>
			<Box flexShrink={0}>
				<PeerInfo {...peerInfo} slots={remoteSlots} remoteMuted={remoteMuted} />
				<Timer />
			</Box>
			<Box flexGrow={1} flexShrink={1} overflow='hidden' alignItems='center' justifyContent='center'>
				<video controls preload='metadata' style={{ height: '100%', objectFit: 'contain' }} ref={remoteStreamRefCallback}>
					<track kind='captions' />
				</video>
			</Box>
			<Box flexShrink={0} mb={8}>
				<ButtonGroup large align='center'>
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
					<ActionButton disabled={connecting || reconnecting} label={t('Forward')} icon='arrow-forward' onClick={onForward} />
					<ActionButton
						label={t('Voice_call__user__hangup', { user: 'userId' in peerInfo ? peerInfo.displayName : peerInfo.number })}
						icon='phone-off'
						danger
						onClick={onEndCall}
					/>
					<DevicePicker />
				</ButtonGroup>
			</Box>
		</Box>
	);
};

export default memo(RoomCallSection);
