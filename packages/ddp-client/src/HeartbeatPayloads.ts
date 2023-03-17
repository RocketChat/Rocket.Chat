/* Heartbeats
 * Messages:
 * ping
 * id: optional string (identifier used to correlate with response)
 * pong
 * id: optional string (same as received in the ping message)
 * Procedure:
 * At any time after the connection is established either side may send a ping message. The sender may chose to include an id field in the ping message. When the other side receives a ping it must immediately respond with a pong message. If the received ping message includes an id field, the pong message must include the same id field.
 */

export type PingPayload = {
	msg: 'ping';
	id?: string;
};

export type PongPayload = {
	msg: 'pong';
	id?: string;
};
