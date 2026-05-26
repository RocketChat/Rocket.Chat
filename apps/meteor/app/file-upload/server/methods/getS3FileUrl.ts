import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms, Uploads } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { UploadFS } from '../../../../server/ufs';
import { canAccessRoomAsync } from '../../../authorization/server';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { settings } from '../../../settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getS3FileUrl(fileId: string): string;
	}
}

Meteor.methods<ServerMethods>({
	/**
	 * @deprecated Scheduled for removal in 9.0.0. No caller found in this repository — kept for external DDP clients only.
	 */
	async getS3FileUrl(fileId) {
		methodDeprecationLogger.method('getS3FileUrl', '9.0.0', []);
		check(fileId, String);
		const uid = Meteor.userId();
		if (settings.get<boolean>('FileUpload_ProtectFiles') && !uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendFileMessage' });
		}
		const file = await Uploads.findOneById(fileId);
		if (!file?.rid) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}
		const room = await Rooms.findOneById(file.rid);
		if (uid && room && !(await canAccessRoomAsync(room, { _id: uid }))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}

		return UploadFS.getStore('AmazonS3:Uploads').getRedirectURL(file);
	},
});
