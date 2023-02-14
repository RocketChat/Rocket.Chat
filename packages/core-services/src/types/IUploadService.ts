import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails';
import type { IMessage, IUpload } from '@rocket.chat/core-typings';

export interface IUploadFileParams {
	userId: string;
	buffer: Buffer;
	details: Partial<IUploadDetails>;
}
export interface ISendFileMessageParams {
	roomId: string;
	userId: string;
	file: IUpload;
	message?: IMessage;
}

export interface ISendFileLivechatMessageParams {
	roomId: string;
	visitorToken: string;
	file: IUpload;
	message?: IMessage;
}

export interface IUploadService {
	uploadFile(params: IUploadFileParams): Promise<IUpload>;
	sendFileMessage(params: ISendFileMessageParams): Promise<IMessage | undefined>;
	sendFileLivechatMessage(params: ISendFileLivechatMessageParams): Promise<IMessage | undefined>;
}
