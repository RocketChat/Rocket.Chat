/**
 * Enumerator represnting call state
 * @remarks
 */

export type CallState =
	| 'IDLE'
	| 'SERVER_CONNECTED'
	| 'REGISTERED'
	| 'OFFER_RECEIVED'
	| 'ANSWER_SENT'
	| 'IN_CALL'
	| 'UNREGISTERED'
	| 'SERVER_DISCONNECTED'
	| 'ERROR';