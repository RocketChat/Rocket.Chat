import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { IVoiceRoomPeer } from '../../../../definition/IVoiceRoomPeer';
import VoicePeer from './VoicePeer';

interface IProps {
	peers: IVoiceRoomPeer[];
	globalDeafen?: boolean;
}

const VoicePeersList: FC<IProps> = ({ peers, globalDeafen }): React.ReactElement => (
	<Box display='flex' flexWrap='wrap' justifyContent='center'>
		{peers.map((peer) => (
			<VoicePeer key={peer.id} {...peer} globalDeafen={globalDeafen} />
		))}
	</Box>
);

export default VoicePeersList;
