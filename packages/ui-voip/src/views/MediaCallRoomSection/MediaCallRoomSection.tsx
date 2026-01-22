import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { CARD_TOTAL_HEIGHT } from './GenericCard';
import PeerCard from './PeerCard';
import StreamCard from './StreamCard';
import { ToggleButton, Timer, DevicePicker, ActionButton } from '../../components';
import { useMediaCallContext } from '../../context';
import useMediaStream from '../../context/useMediaStream';
import useRoomView from '../../context/useRoomView';

const SECTION_MAX_HEIGHT = 50;

const ACTION_STRIP_HEIGHT = 32;
const ACTION_STRIP_MARGIN = 8;

const ACTION_STRIP_TOTAL_HEIGHT = ACTION_STRIP_HEIGHT + ACTION_STRIP_MARGIN * 2;

// The minimun height that will fit 2 cards on top of eachother
const SECTION_MIN_HEIGHT_WRAP_COLLAPSED = (CARD_TOTAL_HEIGHT * 2 + ACTION_STRIP_TOTAL_HEIGHT) / (SECTION_MAX_HEIGHT / 100);

console.log('SECTION_MIN_HEIGHT_WRAP_COLLAPSED', SECTION_MIN_HEIGHT_WRAP_COLLAPSED);

const getSplitStyles = (showChat: boolean) => {
	if (showChat) {
		return {
			maxHeight: `${SECTION_MAX_HEIGHT}vh`,
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
	containerHeight: number;
};

const RoomCallSection = ({ showChat, onToggleChat, user, containerHeight }: RoomCallSectionProps) => {
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
		peerInfo,
		connectionState,
		getRemoteVideoStream,
		toggleScreenSharing,
		getLocalVideoStream,
	} = useMediaCallContext();

	const shouldWrapCollapsed = useMediaQuery(`(min-height: ${SECTION_MIN_HEIGHT_WRAP_COLLAPSED}px)`);
	const shouldWrapCards = showChat ? shouldWrapCollapsed : containerHeight > CARD_TOTAL_HEIGHT * 2;

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	const remoteVideoStream = getRemoteVideoStream();
	const localVideoStreamWrapper = getLocalVideoStream();
	const localVideoStream = localVideoStreamWrapper?.stream ?? null;

	const [remoteStreamRefCallback] = useMediaStream(remoteVideoStream);
	const [localStreamRefCallback] = useMediaStream(localVideoStream);

	useRoomView();

	const onClickShareScreen = () => {
		toggleScreenSharing();
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
			id='outer-element'
			w='full'
			bg='hover'
			borderBlockEnd='1px solid'
			borderBlockEndColor='stroke-light'
			overflow='hidden'
			display='flex'
			flexDirection='column'
			{...getSplitStyles(showChat)}
		>
			{/* TODO wrapper component for the cards */}
			<Box display='flex' flexGrow={1} flexShrink={1} overflow='auto' justifyContent='stretch' alignItems='center'>
				<Box
					display='flex'
					mi='auto'
					width='fit-content'
					flexDirection='row'
					flexWrap={shouldWrapCards ? 'wrap' : 'nowrap'}
					justifyContent='center'
					alignItems='center'
					p={2}
				>
					<PeerCard
						displayName={user.displayName}
						avatarUrl={user.avatarUrl}
						muted={muted}
						held={held}
						sharing={localVideoStream?.active ?? false}
					/>
					<PeerCard
						displayName={peerInfo.displayName}
						avatarUrl={peerInfo.avatarUrl}
						muted={remoteMuted}
						held={remoteHeld}
						sharing={remoteVideoStream?.active ?? false}
					/>
					{remoteVideoStream && (
						<StreamCard title='Remote Video' slots={{ topLeft: <Timer /> }}>
							<video preload='metadata' style={{ objectFit: 'cover', height: '100%', width: '100%' }} ref={remoteStreamRefCallback}>
								<track kind='captions' />
							</video>
						</StreamCard>
					)}
					{localVideoStream?.active && (
						<StreamCard title='Local Video'>
							<video preload='metadata' style={{ objectFit: 'cover', height: '100%', width: '100%' }} ref={localStreamRefCallback}>
								<track kind='captions' />
							</video>
						</StreamCard>
					)}
				</Box>
			</Box>

			<Box display='flex' flexDirection='row' justifyContent='space-evenly' flexShrink={0} mb={8} w='full' height={ACTION_STRIP_HEIGHT}>
				<Box flexGrow={1} flexShrink={0} color='default' alignContent='center' pis={16}>
					<Timer />
				</Box>
				<ButtonGroup large align='center' style={{ flexGrow: 2 }}>
					<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />
					<ToggleButton
						label={t('Screen_sharing')}
						icons={['computer', 'computer']}
						titles={[t('Screen_sharing'), t('Screen_sharing_off')]}
						pressed={localVideoStream?.active ?? false}
						onToggle={onClickShareScreen}
					/>
					<ToggleButton
						label={t('Hold')}
						icons={['pause-shape-unfilled', 'pause-shape-unfilled']}
						titles={[t('Hold'), t('Resume')]}
						pressed={held}
						onToggle={onHold}
					/>
					<ToggleButton
						label={t('Chat')}
						icons={['balloon', 'balloon-off']}
						titles={[t('Open_chat'), t('Close_chat')]}
						pressed={showChat}
						onToggle={onToggleChat}
					/>
					<ActionButton disabled={connecting || reconnecting} label={t('Forward')} icon='arrow-forward' onClick={onForward} />
					<ActionButton label={t('Voice_call__user__hangup', { user: peerInfo.displayName })} icon='phone-off' danger onClick={onEndCall} />
					<DevicePicker />
				</ButtonGroup>
				<Box flexGrow={1} flexShrink={0} /> {/* TODO: This is a hack to center the buttons */}
			</Box>
		</Box>
	);
};

export default memo(RoomCallSection);
