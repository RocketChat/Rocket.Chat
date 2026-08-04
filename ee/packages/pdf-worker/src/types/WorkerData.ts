import type { ILivechatAgent, ILivechatVisitor, IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import type { Root } from '@rocket.chat/message-parser';

export type Quote = { name: string; ts?: Date; md: Root };

export type MessageData = Pick<
	IOmnichannelSystemMessage,
	| 'msg'
	| 'u'
	| 'ts'
	| 'md'
	| 't'
	| 'navigation'
	| 'transferData'
	| 'requestData'
	| 'webRtcCallEndTs'
	| 'comment'
	| 'slaData'
	| 'priorityData'
> & {
	files?: { name?: string; buffer?: Buffer | null; extension?: string }[];
	quotes?: Quote[];
};

export type WorkerData = {
	siteName: string;
	visitor: Pick<ILivechatVisitor, 'username' | 'name' | 'visitorEmails'> | null;
	agent: Pick<ILivechatAgent, 'name' | 'username' | 'utcOffset'> | null;
	closedAt?: Date;
	messages: MessageData[];
	timezone: string;
	dateFormat: string;
	timeAndDateFormat: string;
};
