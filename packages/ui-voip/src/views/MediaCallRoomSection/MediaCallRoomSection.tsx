import { Box } from '@rocket.chat/fuselage';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ToggleButton, Timer, DevicePicker, ActionButton } from '../../components';
import ActionStrip from '../../components/Actions/ActionStrip';
import CardListContainerWrapper from '../../components/Cards/CardListContainerWrapper';
import CardListSection, { SECTION_MAX_HEIGHT } from '../../components/Cards/CardListSection';
import PeerCard from '../../components/Cards/PeerCard';
import StreamCard from '../../components/Cards/StreamCard';
import { useShouldWrapCards } from '../../components/Cards/useShouldWrapCards';
import { useMediaCallContext } from '../../context';
import useMediaStream from '../../context/useMediaStream';
import useRoomView from '../../context/useRoomView';

type RoomCallSectionProps = {
	showChat: boolean;
	onToggleChat: () => void;
	user: {
		displayName: string;
		avatarUrl: string;
	};
	containerHeight: number;
};

const getSplitStyles = (showChat?: boolean) => {
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

const RoomCallSection = ({ showChat, onToggleChat, user, containerHeight }: RoomCallSectionProps) => {
	const { t } = useTranslation();

	const [focusedCard, setFocusedCard] = useState<'remote' | 'local' | null>(null);
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

	const shouldWrapCards = useShouldWrapCards(showChat, containerHeight);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	const remoteVideoStreamWrapper = getRemoteVideoStream();
	const localVideoStreamWrapper = getLocalVideoStream();

	const [remoteStreamRefCallback] = useMediaStream(remoteVideoStreamWrapper?.stream ?? null);
	const [localStreamRefCallback] = useMediaStream(localVideoStreamWrapper?.stream ?? null);

	useRoomView();

	const onClickShareScreen = () => {
		toggleScreenSharing();
	};

	const onClickFocusRemoteCard = () => {
		setFocusedCard((prev) => (prev === 'remote' ? null : 'remote'));
	};

	const onClickFocusLocalCard = () => {
		setFocusedCard((prev) => (prev === 'local' ? null : 'local'));
	};

	useEffect(() => {
		setFocusedCard((focusedCard) => {
			if (focusedCard === 'remote' && !remoteVideoStreamWrapper?.active) {
				return null;
			}
			if (focusedCard === 'local' && !localVideoStreamWrapper?.active) {
				return null;
			}
			return focusedCard;
		});
	}, [remoteVideoStreamWrapper?.active, localVideoStreamWrapper?.active]);

	// TODO: Figure out how to ensure this always exist before rendering the component
	// TODO flter out external peer info
	if (!peerInfo || 'number' in peerInfo) {
		return null;
		// throw new Error('Peer info is required');
	}

	const remoteStreamCard = (
		<StreamCard
			displayName={peerInfo.displayName}
			onClickFocusStream={onClickFocusRemoteCard}
			focused={focusedCard === 'remote'}
			square={!!focusedCard && focusedCard !== 'remote'}
		>
			<video preload='metadata' style={{ objectFit: 'cover', height: '100%', width: '100%' }} ref={remoteStreamRefCallback}>
				<track kind='captions' />
			</video>
		</StreamCard>
	);

	const localStreamCard = (
		<StreamCard
			displayName={user.displayName}
			own
			onClickFocusStream={onClickFocusLocalCard}
			focused={focusedCard === 'local'}
			square={!!focusedCard && focusedCard !== 'local'}
		>
			<video preload='metadata' style={{ objectFit: 'cover', height: '100%', width: '100%' }} ref={localStreamRefCallback}>
				<track kind='captions' />
			</video>
		</StreamCard>
	);

	const focusedCardElement = focusedCard === 'remote' ? remoteStreamCard : localStreamCard;

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
			<CardListSection>
				<CardListContainerWrapper focusedCard={focusedCard ? focusedCardElement : undefined} shouldWrapCards={shouldWrapCards}>
					<PeerCard
						displayName={user.displayName}
						avatarUrl={user.avatarUrl}
						muted={muted}
						held={held}
						sharing={localVideoStreamWrapper?.active ?? false}
					/>
					<PeerCard
						displayName={peerInfo.displayName}
						avatarUrl={peerInfo.avatarUrl}
						muted={remoteMuted}
						held={remoteHeld}
						sharing={remoteVideoStreamWrapper?.active ?? false}
					/>
					{remoteVideoStreamWrapper?.active && focusedCard !== 'remote' && remoteStreamCard}
					{localVideoStreamWrapper?.active && focusedCard !== 'local' && localStreamCard}
				</CardListContainerWrapper>
			</CardListSection>
			<ActionStrip
				leftSlot={
					<Box color='default' alignContent='center' pis={16}>
						<Timer />
					</Box>
				}
			>
				<ToggleButton label={t('Mute')} icons={['mic', 'mic-off']} titles={[t('Mute'), t('Unmute')]} pressed={muted} onToggle={onMute} />
				<ToggleButton
					label={t('Screen_sharing')}
					icons={['computer', 'computer']}
					titles={[t('Screen_sharing'), t('Screen_sharing_off')]}
					pressed={localVideoStreamWrapper?.active ?? false}
					onToggle={onClickShareScreen}
				/>
				<DevicePicker secondary />
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
			</ActionStrip>
		</Box>
	);
};

export default memo(RoomCallSection);
