// Server is sending the other actor's sdp
export type ServerMediaSignalRemoteSDP = {
	callId: string;
	toContractId: string;
	type: 'remote-sdp';

	sdp: RTCSessionDescriptionInit;
};
