import type {
	IOmnichannelRoom,
	IUser,
	ILivechatVisitor,
	IMessage,
	MessageAttachment,
	IMessageInbox,
	IOmnichannelAgent,
} from '@rocket.chat/core-typings';

type GenericCloseRoomParams = {
	room: IOmnichannelRoom;
	comment?: string;
	forceClose?: boolean;
	options?: {
		clientAction?: boolean;
		tags?: string[];
		emailTranscript?:
			| {
					sendToVisitor: false;
			  }
			| {
					sendToVisitor: true;
					requestData: NonNullable<IOmnichannelRoom['transcriptRequest']>;
			  };
		pdfTranscript?: {
			requestedBy: string;
		};
	};
};

export type CloseRoomParamsByUser = {
	user: IUser | null;
} & GenericCloseRoomParams;

export type CloseRoomParamsByVisitor = {
	visitor: ILivechatVisitor;
} & GenericCloseRoomParams;

export type CloseRoomParams = CloseRoomParamsByUser | CloseRoomParamsByVisitor;

type UploadedFile = {
	_id: string;
	name?: string;
	type?: string;
	size?: number;
	description?: string;
	identify?: { size: { width: number; height: number } };
	format?: string;
};

export interface ILivechatMessage {
	token: string;
	_id: string;
	rid: string;
	msg: string;
	file?: UploadedFile;
	files?: UploadedFile[];
	attachments?: MessageAttachment[];
	alias?: string;
	groupable?: boolean;
	blocks?: IMessage['blocks'];
	email?: IMessageInbox['email'];
}

export type ICRMData = {
	_id: string;
	label?: string;
	topic?: string;
	createdAt: Date;
	lastMessageAt?: Date;
	tags?: string[];
	customFields?: IOmnichannelRoom['livechatData'];
	visitor: Pick<ILivechatVisitor, '_id' | 'token' | 'name' | 'username' | 'department' | 'phone' | 'ip'> & {
		email?: ILivechatVisitor['visitorEmails'];
		os?: string;
		browser?: string;
		customFields: ILivechatVisitor['livechatData'];
	};
	agent?: Pick<IOmnichannelAgent, '_id' | 'username' | 'name' | 'customFields'> & {
		email?: NonNullable<IOmnichannelAgent['emails']>[number]['address'];
	};
	crmData?: IOmnichannelRoom['crmData'];
};

export type AKeyOf<T> = {
	[K in keyof T]?: T[K];
};
