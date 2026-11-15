import { StreamVideo } from '@rocket.chat/ui-media';
import { useState } from 'react';

import { CardListContainer, CardListSection, PeerCard, StreamCard } from '../components';
import { useMediaCallView } from '../context';
import { isExternalPeer } from '../utils/isExternalPeer';

export type MediaCallCardListProps = {
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

	const onClickFocusRemoteCard = () => {
		setFocusedCard((prev) => (prev === 'remote' ? null : 'remote'));
	};

	const onClickFocusLocalCard = () => {
		setFocusedCard((prev) => (prev === 'local' ? null : 'local'));
	};

	if (!peerInfo || isExternalPeer(peerInfo)) {
		return null;
	}

	const remoteStreamCard = remoteScreen?.active ? (
		<StreamCard onClickFocusStream={onClickFocusRemoteCard} focused={focusedCard === 'remote'}>
			<StreamVideo stream={remoteScreen.stream} />
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
			<StreamVideo stream={localScreen.stream} />
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
