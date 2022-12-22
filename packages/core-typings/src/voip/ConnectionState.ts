/**
 * Type representing connectionstate
 * @remarks
 */

export type ConnectionState =
	| 'INITIAL'
	| 'SERVER_CONNECTED'
	| 'SERVER_DISCONNECTED'
	| 'SERVER_RECONNECTING'
	| 'WAITING_FOR_NETWORK'
	| 'STOP'
	| 'ERROR';
