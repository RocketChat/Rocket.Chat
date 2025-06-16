/**
 * @category outgoing
 */
export type ConnectPayload = {
	msg: 'connect';
	/** previous DDP session identifier (if trying to reconnect to an existing DDP session) */
	session?: string;
	/** the proposed protocol version */
	version: string;
	/** protocol versions supported by the client, in order of preference */
	support: string[];
};

/**
 * @category incoming
 */
export type ConnectedPayload = {
	msg: 'connected';
	/** an identifier for the DDP session */
	session: string;
};

/**
 * @category incoming
 */
export type FailedPayload = {
	msg: 'failed';
	/** a suggested protocol version to connect with */
	version: string;
};
