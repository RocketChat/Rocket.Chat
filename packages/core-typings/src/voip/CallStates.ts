/**
 * Enumerator representing call state
 * @remarks
 */

export type CallStates =
	| 'INITIAL'
	| 'REGISTERED'
	| 'OFFER_RECEIVED'
	| 'IDLE'
	| 'ANSWER_SENT'
	| 'IN_CALL'
	| 'ON_HOLD'
	| 'UNREGISTERED'
	| 'ERROR';
