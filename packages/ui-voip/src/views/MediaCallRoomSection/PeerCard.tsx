import { Avatar, Box, Icon } from '@rocket.chat/fuselage';

import GenericCard from './GenericCard';

type PeerCardProps = {
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
	sharing: boolean;
};

type GenericCardNameAndAudioStateSlotProps = {
	muted: boolean;
	held: boolean;
	displayName: string;
};

// TODO move to a separate component
const GenericCardNameAndAudioStateSlot = ({ muted, held, displayName }: GenericCardNameAndAudioStateSlotProps) => {
	return (
		<Box is='span' opacity='1' display='flex' flexDirection='row' mi={-4} alignItems='center' justifyContent='center'>
			{(muted || held) && (
				<Box mi={2}>
					{(held || muted) && <Icon name='mic-off' size='x16' color='danger' mi={2} />}
					{held && <Icon name='headphone-off' size='x16' color='danger' mi={2} />}
				</Box>
			)}
			<Box fontScale='p2b' color='default' mi={4}>
				{displayName}
			</Box>
		</Box>
	);
};

// eslint-disable-next-line react/no-multi-comp
const GenericCardSharingSlot = () => {
	return <Icon name='computer' size='x16' color='default' />;
};

// eslint-disable-next-line react/no-multi-comp
const PeerCard = ({ displayName, avatarUrl, muted, held, sharing }: PeerCardProps) => {
	return (
		<GenericCard
			title='Peer Card'
			slots={{
				bottomLeft: <GenericCardNameAndAudioStateSlot muted={muted} held={held} displayName={displayName} />,
				bottomRight: sharing ? <GenericCardSharingSlot /> : null,
			}}
			// width='300px'
			// height='300px'
			flexGrow={0}
			flexShrink={0}
		>
			<Box
				display='flex'
				flexDirection='column'
				alignItems='center'
				justifyItems='center'
				justifyContent='center'
				flexGrow={1}
				flexShrink={0}
			>
				<Box mbe={8}>{avatarUrl ? <Avatar url={avatarUrl} size='x124' /> : <Icon name='user' size='x124' />}</Box>
			</Box>
		</GenericCard>
	);
};

export default PeerCard;
