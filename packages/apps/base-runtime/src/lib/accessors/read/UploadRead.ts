import type { IUploadRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { IUpload } from '@rocket.chat/apps-engine/definition/uploads';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class UploadRead implements IUploadRead {
	constructor(private readonly bridges: RemoteBridges) {}

	public getById(id: string): Promise<IUpload> {
		return this.bridges.getUploadBridge().doGetById(id, 'APP_ID') as Promise<IUpload>;
	}

	public getBuffer(upload: IUpload): Promise<Buffer> {
		return this.bridges.getUploadBridge().doGetBuffer(upload, 'APP_ID') as Promise<Buffer>;
	}

	public async getBufferById(id: string): Promise<Buffer> {
		const upload = (await this.bridges.getUploadBridge().doGetById(id, 'APP_ID')) as IUpload;

		return this.bridges.getUploadBridge().doGetBuffer(upload, 'APP_ID') as Promise<Buffer>;
	}
}
