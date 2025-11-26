export type ClientState =
	| 'none' // The client doesn't recognize a specific call id at all
	| 'pending' // The call is ringing
	| 'accepting' // The client tried to accept the call and is wating for confirmation from the server
	| 'accepted' // The call was accepted, but the client doesn't have a webrtc offer yet
	| 'busy-elsewhere' // The call is happening in a different session/client
	| 'active' // The webrtc call was established
	| 'renegotiating' // the webrtc call was established but the client is starting a new negotiation
	| 'hangup'; // The call is over, or happening in some other client

export type ClientContractState =
	| 'proposed' // we don't know if the contract will be signed
	| 'signed' // the server signed this session's contract
	| 'pre-signed' // the session that requested a call is assuming it will be signed into it
	| 'self-signed' // the call has progressed beyond the signing stage without any signature confirmation
	| 'ignored'; // the server signed a contract from a different session

export type RandomStringFactory = () => string;
