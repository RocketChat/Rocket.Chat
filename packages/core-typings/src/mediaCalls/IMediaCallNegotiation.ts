import type { IRocketChatRecord } from '../IRocketChatRecord';

export type MediaCallNegotiationStream = {
	tag: string;
	id: string;
};

export interface IMediaCallNegotiation extends IRocketChatRecord {
	callId: string;

	offerer: 'caller' | 'callee';

	requestTimestamp: Date;
	offerTimestamp?: Date;
	answerTimestamp?: Date;
	stableTimestamp?: Date;

	offer?: RTCSessionDescriptionInit;
	answer?: RTCSessionDescriptionInit;

	offerStreams?: MediaCallNegotiationStream[];
	answerStreams?: MediaCallNegotiationStream[];
}
