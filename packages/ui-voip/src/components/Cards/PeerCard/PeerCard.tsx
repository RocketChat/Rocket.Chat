import { Avatar, Box, Icon } from '@rocket.chat/fuselage';

import Card from '../Card';
import PeerCardSlot from './PeerCardSlot';

type PeerCardProps = {
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
};

const PeerCard = ({ displayName, avatarUrl, muted, held }: PeerCardProps) => {
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
			>
				<PeerCardSlot muted={muted} held={held} displayName={displayName} />
				<Box mbe={8}>{avatarUrl ? <Avatar url={avatarUrl} size='x48' /> : <Icon name='user' size='x48' />}</Box>
			</Box>
		</Card>
	);
};

export default PeerCard;
