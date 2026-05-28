import { Avatar, Box, Icon } from '@rocket.chat/fuselage';
import type { Ref } from 'react';

import Card from '../Card';
import PeerCardSlot from './PeerCardSlot';

type PeerCardProps = {
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
	// When a video stream is active, the avatar is hidden and the video fills the card.
	videoActive?: boolean;
	videoRef?: Ref<HTMLVideoElement>;
	mirrored?: boolean;
	muteVideoAudio?: boolean;
};

const PeerCard = ({ displayName, avatarUrl, muted, held, videoActive, videoRef, mirrored, muteVideoAudio }: PeerCardProps) => {
	return (
		<Card flexGrow={0} flexShrink={0}>
			<Box
				display='flex'
				alignItems='center'
				justifyItems='center'
				justifyContent='center'
				alignContent='center'
				width='100%'
				height='100%'
				position='relative'
				style={{ overflow: 'hidden' }}
			>
				<PeerCardSlot muted={muted} held={held} displayName={displayName} />
				{videoActive ? (
					<video
						ref={videoRef}
						preload='metadata'
						muted={muteVideoAudio}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: mirrored ? 'scaleX(-1)' : undefined,
						}}
					>
						<track kind='captions' />
					</video>
				) : (
					<Box mbe={8}>{avatarUrl ? <Avatar url={avatarUrl} size='x48' /> : <Icon name='user' size='x48' />}</Box>
				)}
			</Box>
		</Card>
	);
};

export default PeerCard;
