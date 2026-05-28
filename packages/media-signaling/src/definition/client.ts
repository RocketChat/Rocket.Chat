export type ClientState =
	| 'none' // The client doesn't recognize a specific call id at all
	| 'pending' // The call is ringing
	| 'accepting' // The client tried to accept the call and is waiting for confirmation from the server
	| 'transport-connecting' // The call was accepted; the media transport is establishing
	| 'activating' // Transport signaling is stable but media isn't flowing yet
	| 'busy-elsewhere' // The call is happening in a different session/client
	| 'active' // Media is flowing
	| 'hangup'; // The call is over

export type ClientContractState =
	| 'proposed' // we don't know if the contract will be signed
	| 'signed' // the server signed this session's contract
	| 'pre-signed' // the session that requested a call is assuming it will be signed into it
	| 'self-signed' // the call has progressed beyond the signing stage without any signature confirmation
	| 'ignored'; // the server signed a contract from a different session

export type RandomStringFactory = () => string;
