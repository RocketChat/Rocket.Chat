import type { IUploadCreator } from '@rocket.chat/apps-engine/definition/accessors/index.js';
import type { IUploadDescriptor } from '@rocket.chat/apps-engine/definition/uploads/IUploadDescriptor.js';
import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails.js';
import type { IUpload } from '@rocket.chat/apps-engine/definition/uploads/index.js';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/index.js';

import { bridgeCall } from '../../bridges/bridgeCall.js';
import type * as Messenger from '../../messenger.js';

export class UploadCreator implements IUploadCreator {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public async uploadBuffer(buffer: Buffer, descriptor: IUploadDescriptor): Promise<IUpload> {
		if (!Object.hasOwn(descriptor, 'user') && !descriptor.visitorToken) {
			descriptor.user = (await bridgeCall(this.senderFn, 'getUserBridge', 'doGetAppUser', 'APP_ID')) as IUser;
		}

		const details = {
			name: descriptor.filename,
			size: buffer.length,
			rid: descriptor.room.id,
			userId: descriptor.user?.id,
			visitorToken: descriptor.visitorToken,
		} as IUploadDetails;

		return bridgeCall<IUpload>(this.senderFn, 'getUploadBridge', 'doCreateUpload', details, buffer, 'APP_ID');
	}
}
