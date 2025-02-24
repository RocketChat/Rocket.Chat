import type { IUploadRead } from '../../definition/accessors';
import type { IUpload } from '../../definition/uploads';
import type { UploadBridge } from '../bridges/UploadBridge';

export class UploadRead implements IUploadRead {
    constructor(
        private readonly uploadBridge: UploadBridge,
        private readonly appId: string,
    ) {}

    public getById(id: string): Promise<IUpload> {
        return this.uploadBridge.doGetById(id, this.appId);
    }

    public getBuffer(upload: IUpload): Promise<Buffer> {
        return this.uploadBridge.doGetBuffer(upload, this.appId);
    }

    public async getBufferById(id: string): Promise<Buffer> {
        const upload = await this.uploadBridge.doGetById(id, this.appId);

        return this.uploadBridge.doGetBuffer(upload, this.appId);
    }
}
