import { Icon } from '@rocket.chat/fuselage';

import CardSlot from '../CardSlot';

type PeerCardSlotProps = {
	muted: boolean;
	held: boolean;
	displayName: string;
};

const PeerCardSlot = ({ muted, held, displayName }: PeerCardSlotProps) => {
	return (
		<CardSlot position='bottomLeft'>
			{displayName}
			{muted && <Icon name='mic-off' size='x12' color='danger' mis={4} />}
			{held && <Icon name='pause-shape-unfilled' size='x12' color='danger' mis={4} />}
		</CardSlot>
	);
};

export default PeerCardSlot;
