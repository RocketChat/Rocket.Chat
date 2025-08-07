export type ClientState =
	| 'none' // The client doesn't recognize a specific call id at all
	| 'pending' // The call is ringing
	| 'accepting' // The client tried to accept the call and is wating for confirmation from the server
	| 'accepted' // The call was accepted, but the client doesn't have a webrtc offer yet
	| 'has-offer' // The call was accepted and the client has a webrtc offer
	| 'has-answer' // The call was accepted and the client has a webrtc offer and answer
	| 'active' // The webrtc call was established
	| 'hangup'; // The call is over, or happening in some other client
