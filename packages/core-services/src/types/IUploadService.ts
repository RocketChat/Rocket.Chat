import type { IncomingMessage } from 'http';
import type { Transform } from 'stream';

import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails';
import type { IMessage, IUpload, IUser, FilesAndAttachments } from '@rocket.chat/core-typings';

export type ParsedUpload = {
	tempFilePath: string;
	filename: string;
	mimetype: string;
	size: number;
	fieldname: string;
};

export type ParseUploadOptions = {
	field: string;
	maxSize?: number;
	allowedMimeTypes?: string[];
	transforms?: Transform[];
	fileOptional?: boolean;
};

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
	getFileBuffer({ file }: { file: IUpload }): Promise<Buffer>;
	extractMetadata(file: IUpload): Promise<{ height?: number; width?: number; format?: string }>;
	parseFileIntoMessageAttachments(file: Partial<IUpload>, roomId: string, user: IUser): Promise<FilesAndAttachments>;
	parseUpload(
		request: IncomingMessage | Request,
		options: ParseUploadOptions,
	): Promise<{ file: ParsedUpload | null; fields: Record<string, string> }>;
	cleanupTempFile(tempFilePath: string): Promise<void>;
	stripExifFromFile(filePath: string): Promise<number>;
}
