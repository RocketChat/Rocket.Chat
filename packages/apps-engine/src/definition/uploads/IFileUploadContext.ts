import type { IUploadDetails } from './IUploadDetails';

export interface IFileUploadContext {
    file: IUploadDetails;
    content: Buffer;
}
