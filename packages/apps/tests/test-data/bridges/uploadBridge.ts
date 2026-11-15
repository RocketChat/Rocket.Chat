import type { IUpload } from '@rocket.chat/apps-engine/definition/uploads';
import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails';

import { UploadBridge } from '../../../src/server/bridges/UploadBridge';

export class TestUploadBridge extends UploadBridge {
	public getById(id: string, appId: string): Promise<IUpload> {
		throw new Error('Method not implemented');
	}

	public getBuffer(upload: IUpload, appId: string): Promise<Buffer> {
		throw new Error('Method not implemented');
	}

	public createUpload(details: IUploadDetails, buffer: Buffer, appId: string): Promise<IUpload> {
		throw new Error('Method not implemented');
	}
}
