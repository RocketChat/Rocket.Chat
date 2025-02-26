import type { IUpload } from '../uploads';

export interface IUploadRead {
    getById(id: string): Promise<IUpload>;
    getBufferById(id: string): Promise<Buffer>;
    getBuffer(upload: IUpload): Promise<Buffer>;
}
