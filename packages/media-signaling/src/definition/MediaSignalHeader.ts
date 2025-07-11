export type MediaSignalHeaderParams = {
	callId: string;
	sessionId: string;
	version: number;
	sequence: number;

	role: 'caller' | 'callee';

	expectACK?: boolean;
};

export type MediaSignalHeader = MediaSignalHeaderParams & {
	type: 'request' | 'deliver' | 'notify';
	body: Record<string, unknown>;
};
