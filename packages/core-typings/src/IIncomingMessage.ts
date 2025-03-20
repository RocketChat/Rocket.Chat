import type { IncomingMessage } from 'http';

export interface IIncomingMessage extends IncomingMessage {
	query: Record<string, any>;
	body: Record<string, any>;
}
