import type { IOmnichannelRoom, IUser, ILivechatVisitor, IMessage, MessageAttachment, IMessageInbox } from '@rocket.chat/core-typings';

export type GenericCloseRoomParams = {
	room: IOmnichannelRoom;
	comment?: string;
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
