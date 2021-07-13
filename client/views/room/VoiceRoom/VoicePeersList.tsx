import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { IVoiceRoomPeer } from '../../../../definition/IVoiceRoomPeer';
import VoicePeer from './VoicePeer';

interface IProps {
	peers: IVoiceRoomPeer[];
	deafen?: boolean;
}

const VoicePeersList: FC<IProps> = ({ peers, deafen }): React.ReactElement => (
	<Box display='flex' flexWrap='wrap' justifyContent='center'>
		{peers.map((peer) => (
			<VoicePeer key={peer.id} {...peer} deafen={deafen} />
		))}
	</Box>
);

export default VoicePeersList;
