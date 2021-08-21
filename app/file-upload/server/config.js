import path from 'path';

import { Meteor } from 'meteor/meteor';
import { UploadFS } from 'meteor/jalik:ufs';

import { canAccessRoom, hasPermission } from '../../authorization/server';
import { settings } from '../../settings/server';

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

		if (canAccessRoom(null, null, doc)) {
			return true;
		}

		return false;
	},
	update(userId, doc) {
		return hasPermission(Meteor.userId(), 'delete-message', doc.rid) || (settings.get('Message_AllowDeleting') && userId === doc.userId);
	},
	remove(userId, doc) {
		return hasPermission(Meteor.userId(), 'delete-message', doc.rid) || (settings.get('Message_AllowDeleting') && userId === doc.userId);
	},
});
