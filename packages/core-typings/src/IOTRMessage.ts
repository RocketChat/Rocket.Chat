import type { IMessage } from './IMessage';

export interface IOTRMessage extends IMessage {
	otr?: { ack?: string };
}
