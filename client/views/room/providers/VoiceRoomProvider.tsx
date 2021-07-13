import React, { FC, ReactElement, useState } from 'react';

import VoiceRoomClient from '../../../../app/voice-channel/client';
import { IVoiceRoomPeer } from '../../../../definition/IVoiceRoomPeer';
import { VoiceRoomContext } from '../contexts/VoiceRoomContext';

export const VoiceRoomProvider: FC = ({ children }): ReactElement => {
	const [mediasoupPeers, setMediasoupPeers] = useState<Array<IVoiceRoomPeer>>([]);
	const [wsPeers, setWsPeers] = useState<Array<IVoiceRoomPeer>>([]);

	const [mediasoupClient, setMediasoupClient] = useState<VoiceRoomClient | null>(null);
	const [wsClient, setWsClient] = useState<VoiceRoomClient | null>(null);

	return (
		<VoiceRoomContext.Provider
			value={{
				mediasoupClient,
				wsClient,
				setMediasoupClient,
				setWsClient,
				mediasoupPeers,
				setMediasoupPeers,
				setWsPeers,
				wsPeers,
			}}
		>
			{children}
		</VoiceRoomContext.Provider>
	);
};
