import { useState } from 'react';

import { CardListContainer, CardListSection, PeerCard, StreamCard } from '../components';
import { useMediaCallView } from '../context';
import { usePlayMediaStream } from '../providers/usePlayMediaStream';

type MediaCallCardListProps = {
	shouldWrapCards: boolean;
	user: {
		displayName: string;
		avatarUrl: string;
	};
};

const MediaCallCardList = ({ user, shouldWrapCards }: MediaCallCardListProps) => {
	const [focusedCard, setFocusedCard] = useState<'remote' | 'local' | null>('remote');
	const {
		sessionState,
		onToggleScreenSharing,
		streams: { remoteScreen, localScreen },
	} = useMediaCallView();
	const { muted, held, remoteMuted, remoteHeld, peerInfo } = sessionState;

	const [remoteStreamRefCallback] = usePlayMediaStream(remoteScreen?.stream ?? null);
	const [localStreamRefCallback] = usePlayMediaStream(localScreen?.stream ?? null);

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
			<video
				preload='metadata'
				style={{ objectFit: 'contain', height: '100%', width: '100%' }}
				ref={remoteStreamRefCallback}
				autoPlay={true}
				muted={true}
				playsInline={true}
			>
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
			<video
				preload='metadata'
				style={{ objectFit: 'contain', height: '100%', width: '100%' }}
				ref={localStreamRefCallback}
				autoPlay={true}
				playsInline={true}
				muted={true}
			>
				<track kind='captions' />
			</video>
		</StreamCard>
	) : null;

	const focusedCardElement = focusedCard === 'remote' ? remoteStreamCard : localStreamCard;

	return (
		<CardListSection>
			<CardListContainer focusedCard={focusedCard ? focusedCardElement : undefined} shouldWrapCards={shouldWrapCards}>
				<PeerCard displayName={user.displayName} avatarUrl={user.avatarUrl} muted={muted} held={held} />
				<PeerCard displayName={peerInfo.displayName} avatarUrl={peerInfo.avatarUrl} muted={remoteMuted} held={remoteHeld} />
				{focusedCard !== 'remote' && remoteStreamCard}
				{focusedCard !== 'local' && localStreamCard}
			</CardListContainer>
		</CardListSection>
	);
};

export default MediaCallCardList;
