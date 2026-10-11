import type { IUploadRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { IUpload } from '@rocket.chat/apps-engine/definition/uploads';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class UploadRead implements IUploadRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getById(id: string): Promise<IUpload> {
		return bridgeCall<IUpload>(this.senderFn, 'getUploadBridge', 'doGetById', id, 'APP_ID');
	}

	public getBuffer(upload: IUpload): Promise<Buffer> {
		return bridgeCall<Buffer>(this.senderFn, 'getUploadBridge', 'doGetBuffer', upload, 'APP_ID');
	}

	public async getBufferById(id: string): Promise<Buffer> {
		const upload = (await bridgeCall(this.senderFn, 'getUploadBridge', 'doGetById', id, 'APP_ID')) as IUpload;

		return bridgeCall<Buffer>(this.senderFn, 'getUploadBridge', 'doGetBuffer', upload, 'APP_ID');
	}
}
