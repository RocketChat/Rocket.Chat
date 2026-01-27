import { Avatar, Box, Icon } from '@rocket.chat/fuselage';

import CardSlotAudioState from './CardSlotAudioState';
import CardSlotName from './CardSlotName';
import CardSlotStreamingState from './CardSlotStreamingState';
import GenericCard from './GenericCard';

type PeerCardProps = {
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
	sharing: boolean;
};

const PeerCard = ({ displayName, avatarUrl, muted, held, sharing }: PeerCardProps) => {
	return (
		<GenericCard
			slots={{
				topLeft: muted || held ? <CardSlotAudioState muted={muted} held={held} /> : null,
				bottomLeft: <CardSlotName displayName={displayName} />,
				bottomRight: sharing ? <CardSlotStreamingState /> : null,
			}}
			flexGrow={0}
			flexShrink={0}
		>
			<Box
				display='flex'
				alignItems='center'
				justifyItems='center'
				justifyContent='center'
				alignContent='center'
				width='100%'
				height='100%'
			>
				<Box mbe={8}>{avatarUrl ? <Avatar url={avatarUrl} size='x48' /> : <Icon name='user' size='x48' />}</Box>
			</Box>
		</GenericCard>
	);
};

export default PeerCard;
