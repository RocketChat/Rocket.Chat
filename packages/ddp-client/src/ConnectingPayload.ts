// Establishing a DDP Connection:
// Messages:
// connect (client -> server)
//  session: string (if trying to reconnect to an existing DDP session)
//  version: string (the proposed protocol version)
//  support: array of strings (protocol versions supported by the client, in order of preference)
// connected (server->client)
//  session: string (an identifier for the DDP session)
// failed (server->client)
//  version: string (a suggested protocol version to connect with)

export type ConnectPayload = {
	msg: 'connect';
	version: string;
	support: string[];
};

export type ConnectedPayload = {
	msg: 'connected';
	session: string;
};

export type FailedPayload = {
	msg: 'failed';
	version: string;
};
