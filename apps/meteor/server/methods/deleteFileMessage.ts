import { Upload } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages, Users, Uploads } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { DeleteResult } from 'mongodb';

import { FileUpload } from '../../app/file-upload/server';
import { deleteMessageValidatingPermission } from '../../app/lib/server/functions/deleteMessage';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteFileMessage(fileID: string): Promise<void | DeleteResult>;
	}
}

Meteor.methods<ServerMethods>({
	async deleteFileMessage(fileID) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteFileMessage',
			});
		}
		check(fileID, String);

		const msg = await Messages.getMessageByFileId(fileID);

		if (msg) {
			return deleteMessageValidatingPermission(msg, userId);
		}

		const user = await Users.findOneById(userId, { projection: { username: 1 } });
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteFileMessage',
			});
		}

		const file = await Uploads.findOneById(fileID, { projection: { userId: 1, rid: 1, expiresAt: 1, uploadedAt: 1 } });
		if (!file) {
			throw new Meteor.Error('error-invalid-file', 'Invalid file', {
				method: 'deleteFileMessage',
			});
		}

		if (!(await Upload.canDeleteFile(user, file, null))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'deleteFileMessage',
			});
		}

		return FileUpload.getStore('Uploads').deleteById(fileID);
	},
});
