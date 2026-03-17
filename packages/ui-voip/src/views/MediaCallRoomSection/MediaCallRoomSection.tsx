import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	ToggleButton,
	Timer,
	DevicePicker,
	ActionButton,
	CardListContainer,
	CardListSection,
	PeerCard,
	StreamCard,
	useShouldWrapCards,
	CARD_LIST_SECTION_MAX_HEIGHT,
	ActionStrip,
	ActionToggleChat,
} from '../../components';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import useRoomView from '../../context/useRoomView';
import { usePlayMediaStream } from '../../providers/usePlayMediaStream';

type MediaCallRoomSectionProps = {
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
			maxHeight: `${CARD_LIST_SECTION_MAX_HEIGHT}vh`,
		};
	}
	return {
		height: '100%',
		// This is a workaround to match the border height with the sidebar footer
		// The sidebar footer uses a divider instead of a border, so it's 1px taller than it should be.
		paddingBlockEnd: '1px',
	};
};

const MediaCallRoomSection = ({ showChat, onToggleChat, user, containerHeight }: MediaCallRoomSectionProps) => {
	const { t } = useTranslation();

	const [focusedCard, setFocusedCard] = useState<'remote' | 'local' | null>('remote');
	const {
		sessionState,
		onMute,
		onHold,
		onForward,
		onEndCall,
		onToggleScreenSharing,
		streams: { remoteScreen, localScreen },
	} = useMediaCallView();

	const { muted, held, remoteMuted, remoteHeld, peerInfo, connectionState, startedAt } = sessionState;

	const shouldWrapCards = useShouldWrapCards(showChat, containerHeight);

	const connecting = connectionState === 'CONNECTING';
	const reconnecting = connectionState === 'RECONNECTING';

	const [remoteStreamRefCallback] = usePlayMediaStream(remoteScreen?.stream ?? null);
	const [localStreamRefCallback] = usePlayMediaStream(localScreen?.stream ?? null);

	useRoomView();

	const onClickFocusRemoteCard = () => {
		setFocusedCard((prev) => (prev === 'remote' ? null : 'remote'));
	};

	const onClickFocusLocalCard = () => {
		setFocusedCard((prev) => (prev === 'local' ? null : 'local'));
	};

	if (!peerInfo || 'number' in peerInfo) {
		return null;
	}

	const remoteStreamCard = remoteScreen?.active ? (
		<StreamCard onClickFocusStream={onClickFocusRemoteCard} focused={focusedCard === 'remote'}>
			<video preload='metadata' style={{ objectFit: 'contain', height: '100%', width: '100%' }} ref={remoteStreamRefCallback}>
				<track kind='captions' />
			</video>
		</StreamCard>
	) : null;

	const localStreamCard = localScreen?.active ? (
		<StreamCard
			own
			onClickFocusStream={onClickFocusLocalCard}
			onClickStopSharing={onToggleScreenSharing}
			focused={focusedCard === 'local'}
			showStopSharingOnHover
		>
			<video preload='metadata' style={{ objectFit: 'contain', height: '100%', width: '100%' }} ref={localStreamRefCallback}>
				<track kind='captions' />
			</video>
		</StreamCard>
	) : null;

	const focusedCardElement = focusedCard === 'remote' ? remoteStreamCard : localStreamCard;

	return (
		<Box
			id='outer-element'
			w='full'
			bg='surface-tint'
			overflow='hidden'
			display='flex'
			flexDirection='column'
			{...getSplitStyles(showChat)}
		>
			<CardListSection>
				<CardListContainer focusedCard={focusedCard ? focusedCardElement : undefined} shouldWrapCards={shouldWrapCards}>
					<PeerCard displayName={user.displayName} avatarUrl={user.avatarUrl} muted={muted} held={held} />
					<PeerCard displayName={peerInfo.displayName} avatarUrl={peerInfo.avatarUrl} muted={remoteMuted} held={remoteHeld} />
					{focusedCard !== 'remote' && remoteStreamCard}
					{focusedCard !== 'local' && localStreamCard}
				</CardListContainer>
			</CardListSection>
			<ActionStrip
				leftSlot={
					<Box color='default' alignContent='center' pis={16}>
						<Timer startAt={startedAt} />
					</Box>
				}
				rightSlot={
					<ButtonGroup>
						<ActionToggleChat pressed={showChat} onClick={onToggleChat} />
						<DevicePicker secondary />
					</ButtonGroup>
				}
			>
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
				<ActionButton label={t('Voice_call__user__hangup', { user: peerInfo.displayName })} icon='phone-off' danger onClick={onEndCall} />
			</ActionStrip>
		</Box>
	);
};

export default memo(MediaCallRoomSection);
