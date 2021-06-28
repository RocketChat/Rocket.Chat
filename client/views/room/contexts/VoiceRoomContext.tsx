import { createContext, Dispatch, SetStateAction, useContext } from 'react';

import VoiceRoomClient from '../../../../app/voice-channel/client';
import { IVoiceRoomPeer } from '../../../../definition/IVoiceRoomPeer';

type T = {
	mediasoupClient: VoiceRoomClient | null;
	mediasoupPeers: Array<IVoiceRoomPeer>;
	setMediasoupPeers: Dispatch<SetStateAction<Array<IVoiceRoomPeer>>>;
	wsClient: VoiceRoomClient | null;
	wsPeers: Array<IVoiceRoomPeer>;
	setWsPeers: Dispatch<SetStateAction<Array<IVoiceRoomPeer>>>;
	setMediasoupClient: Dispatch<SetStateAction<VoiceRoomClient | null>>;
	setWsClient: Dispatch<SetStateAction<VoiceRoomClient | null>>;
};

export type VoiceRoomContextValue = T | undefined;

export const VoiceRoomContext = createContext<VoiceRoomContextValue>(undefined);

export const useVoiceRoomContext = (): T => {
	const val = useContext(VoiceRoomContext);

	if (!val) {
		throw new Error('VoiceRoomProvider not provided');
	}

	return val;
};
