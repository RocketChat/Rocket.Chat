/**
 * Enumerator representing call state
 * @remarks
 */

export type CallStates =
	| 'INITIAL'
	| 'SERVER_CONNECTED'
	| 'REGISTERED'
	| 'OFFER_RECEIVED'
	| 'IDLE'
	| 'ANSWER_SENT'
	| 'IN_CALL'
	| 'ON_HOLD'
	| 'UNREGISTERED'
	| 'SERVER_DISCONNECTED'
	| 'ERROR';
