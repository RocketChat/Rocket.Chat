/**
 * @category incoming | outgoing
 *
 * At any time after the connection is established either side may send a ping message. The other side
 * must respond with a pong message as soon as possible.
 */
export type PingPayload = {
	msg: 'ping';
	/** identifier used to correlate with response */
	id?: string;
};

/**
 * @category incoming | outgoing
 *
 * The pong message is sent in response to a ping message. If the ping message included an id field,
 * the pong message must include the same id field.
 */
export type PongPayload = {
	msg: 'pong';
	/** identifier as received in the ping message */
	id?: string;
};
