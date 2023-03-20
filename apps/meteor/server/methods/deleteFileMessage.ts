import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { FileUpload } from '../../app/file-upload/server';
import { Messages } from '../../app/models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteFileMessage(fileID: string): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async deleteFileMessage(fileID) {
		check(fileID, String);

		const msg = Messages.getMessageByFileId(fileID);

		if (msg) {
			return Meteor.call('deleteMessage', msg);
		}

		return FileUpload.getStore('Uploads').deleteById(fileID);
	},
});
