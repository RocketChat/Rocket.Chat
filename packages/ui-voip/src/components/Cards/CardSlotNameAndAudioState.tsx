import { Box, Icon } from '@rocket.chat/fuselage';

type GenericCardNameAndAudioStateSlotProps = {
	muted: boolean;
	held: boolean;
	displayName: string;
};

const GenericCardNameAndAudioStateSlot = ({ muted, held, displayName }: GenericCardNameAndAudioStateSlotProps) => {
	return (
		<Box is='span' display='flex' flexDirection='row' mi={-4} alignItems='center' justifyContent='center'>
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

export default GenericCardNameAndAudioStateSlot;
