import type { IRoom, IUser, IOmnichannelSystemMessage, ILivechatVisitor, ILivechatAgent } from '@rocket.chat/core-typings';
import type { Root } from '@rocket.chat/message-parser';

export const isPromiseRejectedResult = (result: any): result is PromiseRejectedResult => result.status === 'rejected';

export type WorkDetails = {
	rid: IRoom['_id'];
	userId: IUser['_id'];
};

export type WorkDetailsWithSource = WorkDetails & {
	from: string;
};

export type Quote = { name: string; ts?: Date; md: Root };

export type MessageData = Pick<
	IOmnichannelSystemMessage,
	| 'msg'
	| '_id'
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
	files: ({ name?: string; buffer?: Buffer; extension?: string } | undefined)[];
	quotes: (Quote | undefined)[];
};

export type WorkerData = {
	siteName: string;
	visitor: Pick<ILivechatVisitor, '_id' | 'username' | 'name' | 'visitorEmails'> | null;
	agent: ILivechatAgent | undefined | null;
	closedAt?: Date;
	messages: MessageData[];
	timezone: string;
	dateFormat: string;
	timeAndDateFormat: string;
	translations: { key: string; value: string }[];
	serverLanguage: string;
};
