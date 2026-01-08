import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import GenericCard from './GenericCard';
import PeerCard from './PeerCard';
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

type RoomCallSectionProps = {
	showChat: boolean;
	onToggleChat: () => void;
	user: {
		displayName: string;
		avatarUrl: string;
	};
};

const RoomCallSection = ({ showChat, onToggleChat, user }: RoomCallSectionProps) => {
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
		// getRemoteStream,
		getRemoteVideoStream,
		toggleScreenSharing,
		getLocalVideoStream,
	} = useMediaCallContext();

	// const { element: keypad, buttonProps: keypadButtonProps } = useKeypad(onTone);

	// const slots = useInfoSlots(muted, held, connectionState);
	// const remoteSlots = useInfoSlots(remoteMuted, remoteHeld);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	const remoteVideoStream = getRemoteVideoStream();
	const localVideoStreamWrapper = getLocalVideoStream();
	const localVideoStream = localVideoStreamWrapper?.stream ?? null;

	console.log('localVideoStream', localVideoStream);
	console.log('remoteVideoStream', remoteVideoStream);

	const [remoteStreamRefCallback] = useMediaStream(remoteVideoStream);
	const [localStreamRefCallback] = useMediaStream(localVideoStream);

	useRoomView();

	const onClickShareScreen = () => {
		toggleScreenSharing();
		setSharingScreen((prev) => !prev);
	};

	// TODO: Figure out how to ensure this always exist before rendering the component
	// TODO flter out external peer info
	if (!peerInfo || 'number' in peerInfo) {
		return null;
		// throw new Error('Peer info is required');
	}

	// TODO: Video element arrangement and "pinning"
	return (
		<Box
			w='full'
			bg='hover'
			// flexShrink={1}
			// flexGrow={1}
			borderBlockEnd='1px solid'
			borderBlockEndColor='stroke-light'
			overflow='hidden'
			display='block'
			{...getSplitStyles(showChat)}
		>
			{/* TODO wrapper component for the cards */}
			<Box display='flex' w='full' flexWrap='wrap' mbe={8} overflow='hidden'>
				<Box
					display='flex'
					flexGrow={1}
					flexShrink={0}
					overflow='hidden'
					flexDirection='row'
					justifyContent='center'
					h='100%'
					flexBasis='100%'
					flexWrap='wrap'
				>
					{/* Own user card */}
					<PeerCard
						displayName={user.displayName}
						avatarUrl={user.avatarUrl}
						muted={muted}
						held={held}
						sharing={localVideoStream?.active ?? false}
					/>
					{/* Remote user card */}
					<PeerCard
						displayName={peerInfo.displayName}
						avatarUrl={peerInfo.avatarUrl}
						muted={remoteMuted}
						held={remoteHeld}
						sharing={remoteVideoStream?.active ?? false}
					/>
					{remoteVideoStream && (
						<GenericCard title='Remote Video' slots={{ topLeft: <Timer /> }}>
							<video preload='metadata' style={{ objectFit: 'contain' }} ref={remoteStreamRefCallback}>
								<track kind='captions' />
							</video>
						</GenericCard>
					)}
					{localVideoStream?.active && (
						<GenericCard title='Local Video'>
							<video preload='metadata' style={{ objectFit: 'contain' }} ref={localStreamRefCallback}>
								<track kind='captions' />
							</video>
						</GenericCard>
					)}
				</Box>
				<Box display='flex' flexDirection='row' justifyContent='space-between' flexShrink={0} mb={8} w='full'>
					<Box flexGrow={1} color='default' alignContent='center' pis={16}>
						<Timer />
					</Box>
					<ButtonGroup large align='center' style={{ flexGrow: 2 }}>
						{/* <ActionButton disabled={connecting || reconnecting} icon='dialpad' label='Dialpad' {...keypadButtonProps} /> */}
						<ToggleButton
							label={t('Mute')}
							icons={['mic', 'mic-off']}
							titles={[t('Mute'), t('Unmute')]}
							pressed={muted}
							onToggle={onMute}
						/>
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
							label={t('Voice_call__user__hangup', { user: peerInfo.displayName })}
							icon='phone-off'
							danger
							onClick={onEndCall}
						/>
						<DevicePicker />
					</ButtonGroup>
					<Box flexGrow={1} /> {/* TODO: This is a hack to center the buttons */}
				</Box>
			</Box>
		</Box>
	);
};

export default memo(RoomCallSection);
