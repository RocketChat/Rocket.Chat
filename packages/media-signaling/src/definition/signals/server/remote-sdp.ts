import type { MediaStreamIdentification } from '../../media/MediaStreamIdentification.js';

/** Server is sending the other actor's sdp */
export type ServerMediaSignalRemoteSDP = {
	callId: string;
	toContractId: string;
	type: 'remote-sdp';

	sdp: RTCSessionDescriptionInit;
	negotiationId: string;
	streams?: MediaStreamIdentification[];
};
