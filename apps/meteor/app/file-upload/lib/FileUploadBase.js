import path from 'path';

import { Meteor } from 'meteor/meteor';

import { UploadFS } from '../../../server/ufs';
import { canAccessRoomAsync } from '../../authorization/server';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { settings } from '../../settings';

// set ufs temp dir to $TMPDIR/ufs instead of /tmp/ufs if the variable is set
if ('TMPDIR' in process.env) {
	UploadFS.config.tmpDir = path.join(process.env.TMPDIR, 'ufs');
}

UploadFS.config.defaultStorePermissions = new UploadFS.StorePermissions({
	insert(userId, doc) {
		if (userId) {
			return true;
		}

		// allow inserts from slackbridge (message_id = slack-timestamp-milli)
		if (doc && doc.message_id && doc.message_id.indexOf('slack-') === 0) {
			return true;
		}

		// allow inserts to the UserDataFiles store
		if (doc && doc.store && doc.store.split(':').pop() === 'UserDataFiles') {
			return true;
		}

		if (Promise.await(canAccessRoomAsync(null, null, doc))) {
			return true;
		}

		return false;
	},
	update(userId, doc) {
		return Promise.await(
			hasPermissionAsync(Meteor.userId(), 'delete-message', doc.rid) || (settings.get('Message_AllowDeleting') && userId === doc.userId),
		);
	},
	remove(userId, doc) {
		return Promise.await(
			hasPermissionAsync(Meteor.userId(), 'delete-message', doc.rid) || (settings.get('Message_AllowDeleting') && userId === doc.userId),
		);
	},
});
