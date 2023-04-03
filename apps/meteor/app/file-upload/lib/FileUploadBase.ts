import path from 'path';

import { Meteor } from 'meteor/meteor';

import { UploadFS } from '../../../server/ufs';
import { canAccessRoomAsync } from '../../authorization/server';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { settings } from '../../settings/server';

// set ufs temp dir to $TMPDIR/ufs instead of /tmp/ufs if the variable is set
if ('TMPDIR' in process.env) {
	UploadFS.config.tmpDir = path.join(process.env.TMPDIR || '', 'ufs');
}

UploadFS.config.defaultStorePermissions = new UploadFS.StorePermissions({
	async insert(userId, doc) {
		if (userId) {
			return true;
		}

		// allow inserts from slackbridge (message_id = slack-timestamp-milli)
		if (doc?.message_id?.indexOf('slack-') === 0) {
			return true;
		}

		// allow inserts to the UserDataFiles store
		if (doc?.store?.split(':').pop() === 'UserDataFiles') {
			return true;
		}

		if (await canAccessRoomAsync(undefined, undefined, doc)) {
			return true;
		}

		return false;
	},
	async update(userId, doc) {
		const cUserId = Meteor.userId();
		if (!cUserId) {
			return false;
		}
		return (
			(await hasPermissionAsync(cUserId, 'delete-message', doc.rid)) ||
			(settings.get<boolean>('Message_AllowDeleting') && userId === doc.userId)
		);
	},
	async remove(userId, doc) {
		const cUserId = Meteor.userId();
		if (!cUserId) {
			return false;
		}
		return (
			(await hasPermissionAsync(cUserId, 'delete-message', doc.rid)) ||
			(settings.get<boolean>('Message_AllowDeleting') && userId === doc.userId)
		);
	},
});
