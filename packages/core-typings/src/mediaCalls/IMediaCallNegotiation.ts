import type { IRocketChatRecord } from '../IRocketChatRecord';

export interface IMediaCallNegotiation extends IRocketChatRecord {
	callId: string;

	offerer: 'caller' | 'callee';

	requestTimestamp: Date;
	offerTimestamp?: Date;
	answerTimestamp?: Date;
	stableTimestamp?: Date;

	offer?: RTCSessionDescriptionInit;
	answer?: RTCSessionDescriptionInit;
}
