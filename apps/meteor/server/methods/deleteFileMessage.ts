import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Messages } from '@rocket.chat/models';

import { FileUpload } from '../../app/file-upload/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteFileMessage(fileID: string): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async deleteFileMessage(fileID) {
		check(fileID, String);

		const msg = await Messages.getMessageByFileId(fileID);
		if (msg) {
			return Meteor.callAsync('deleteMessage', msg);
		}

		return FileUpload.getStore('Uploads').deleteById(fileID);
	},
});
