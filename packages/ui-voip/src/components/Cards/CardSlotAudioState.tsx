import { Icon } from '@rocket.chat/fuselage';

type CardSlotAudioStateProps = {
	muted: boolean;
	held: boolean;
};

const CardSlotAudioState = ({ muted, held }: CardSlotAudioStateProps) => {
	return (
		<>
			{(held || muted) && <Icon name='mic-off' size='x12' color='danger' mis={4} />}
			{held && <Icon name='headphone-off' size='x12' color='danger' mis={4} />}
		</>
	);
};

export default CardSlotAudioState;
