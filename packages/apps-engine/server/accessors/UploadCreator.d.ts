import type { IUploadCreator } from '../../definition/accessors';
import type { IUpload } from '../../definition/uploads';
import type { IUploadDescriptor } from '../../definition/uploads/IUploadDescriptor';
import type { AppBridges } from '../bridges';
export declare class UploadCreator implements IUploadCreator {
    private readonly bridges;
    private readonly appId;
    constructor(bridges: AppBridges, appId: string);
    uploadBuffer(buffer: Buffer, descriptor: IUploadDescriptor): Promise<IUpload>;
}
