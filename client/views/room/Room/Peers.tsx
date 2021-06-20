import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { IVoiceRoomPeer } from '../../../../definition/IVoiceRoomPeer';
import PeerView from './PeerView';

interface IProps {
	peers: IVoiceRoomPeer[];
}

const Peers: FC<IProps> = (props): React.ReactElement => {
	const { peers } = props;
	return (
		<Box>
			{peers.map((peer) => (
				<PeerView key={peer.id} {...peer} />
			))}
		</Box>
	);
};

export default Peers;
