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
	message?: Partial<IMessage>;
}

export interface ISendFileLivechatMessageParams {
	roomId: string;
	visitorToken: string;
	file: IUpload;
	message?: Partial<IMessage>;
}

export interface IUploadService {
	uploadFile(params: IUploadFileParams): Promise<IUpload>;
	sendFileMessage(params: ISendFileMessageParams): Promise<boolean | undefined>;
	sendFileLivechatMessage(params: ISendFileLivechatMessageParams): Promise<boolean | undefined>;
	getFileBuffer({ file }: { userId: string; file: IUpload }): Promise<Buffer>;
}
