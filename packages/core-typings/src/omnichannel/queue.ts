import type { InquiryWithAgentInfo } from '../IInquiry';

export interface IOmnichannelQueue {
	delay(): number;
	start(): Promise<void>;
	shouldStart(): void;
	stop(): Promise<void>;
	getActiveQueues(): Promise<(string | undefined)[]>;
	nextQueue(): Promise<string | undefined>;
	execute(): Promise<void>;
	checkQueue(queue: string | undefined): Promise<void>;
	processWaitingQueue(department: string | undefined, inquiry: InquiryWithAgentInfo): Promise<boolean>;
}
