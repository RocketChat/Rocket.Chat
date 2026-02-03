import type { IUploadDetails } from './IUploadDetails';

export interface IFileUploadInternalContext {
	file: IUploadDetails;
	path: string;
}

export interface IFileUploadContext {
	file: IUploadDetails;
	content: Buffer;
}
