import { BaseBridge } from './BaseBridge';
import type { IUpload } from '../../definition/uploads';
import type { IUploadDetails } from '../../definition/uploads/IUploadDetails';
export declare abstract class UploadBridge extends BaseBridge {
    doGetById(id: string, appId: string): Promise<IUpload>;
    doGetBuffer(upload: IUpload, appId: string): Promise<Buffer>;
    doCreateUpload(details: IUploadDetails, buffer: Buffer, appId: string): Promise<IUpload>;
    protected abstract getById(id: string, appId: string): Promise<IUpload>;
    protected abstract getBuffer(upload: IUpload, appId: string): Promise<Buffer>;
    protected abstract createUpload(details: IUploadDetails, buffer: Buffer, appId: string): Promise<IUpload>;
    private hasReadPermission;
    private hasWritePermission;
}
