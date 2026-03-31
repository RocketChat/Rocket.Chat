import type Stream from 'stream';

import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails';
import type { IMessage, IUpload, IUser, FilesAndAttachments } from '@rocket.chat/core-typings';

export interface IUploadFileParams {
	userId: string;
	buffer: Buffer;
	details: IUploadDetails;
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
	getFileBuffer({ file }: { file: IUpload }): Promise<Buffer>;
	extractMetadata(file: IUpload): Promise<{ height?: number; width?: number; format?: string }>;
	parseFileIntoMessageAttachments(file: Partial<IUpload>, roomId: string, user: IUser): Promise<FilesAndAttachments>;
	canDeleteFile(user: IUser, file: IUpload, msg: IMessage | null): Promise<boolean>;
	deleteFile(user: IUser, fileId: IUpload['_id'], msg: IMessage | null): Promise<{ deletedFiles: IUpload['_id'][] }>;
	streamUploadedFile({
		file,
		imageResizeOpts,
	}: {
		file: IUpload;
		imageResizeOpts?: { width: number; height: number };
	}): Promise<Stream.Readable>;
	uploadFileFromStream({ streamParam, details }: { streamParam: Stream.Readable; details: Omit<IUploadDetails, 'size'> }): Promise<IUpload>;
}
