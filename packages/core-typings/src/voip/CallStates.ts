/**
 * Enumerator representing call state
 * @remarks
 */

export type CallStates =
	| 'INITIAL'
	| 'REGISTERED'
	| 'OFFER_RECEIVED'
	| 'OFFER_SENT'
	| 'IDLE'
	| 'ANSWER_SENT'
	| 'ANSWER_RECEIVED'
	| 'IN_CALL'
	| 'ON_HOLD'
	| 'UNREGISTERED'
	| 'ERROR';
