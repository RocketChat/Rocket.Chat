import { Icon } from '@rocket.chat/fuselage';

type CardSlotAudioStateProps = {
	muted: boolean;
	held: boolean;
};

const CardSlotAudioState = ({ muted, held }: CardSlotAudioStateProps) => {
	return (
		<>
			{(held || muted) && <Icon name='mic-off' size='x16' color='danger' mi={2} />}
			{held && <Icon name='headphone-off' size='x16' color='danger' mi={2} />}
		</>
	);
};

export default CardSlotAudioState;
