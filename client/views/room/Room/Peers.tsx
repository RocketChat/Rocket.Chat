import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { IVoiceRoomPeer } from '../../../../definition/IVoiceRoomPeer';
import PeerView from './PeerView';

interface IProps {
	peers: IVoiceRoomPeer[];
	deafen?: boolean;
}

const Peers: FC<IProps> = (props): React.ReactElement => {
	const { peers, deafen } = props;
	return (
		<Box>
			{peers.map((peer) => (
				<PeerView key={peer.id} {...peer} deafen={deafen} />
			))}
		</Box>
	);
};

export default Peers;
