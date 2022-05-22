import { UploadFS } from 'meteor/jalik:ufs';
import _ from 'underscore';

import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import './AmazonS3.js';
import './FileSystem.js';
import './GoogleStorage.js';
import './GridFS.js';
import './Webdav.js';

const configStore = _.debounce(() => {
	const store = settings.get('FileUpload_Storage_Type');

	if (store) {
		SystemLogger.info(`Setting default file store to ${store}`);
		UploadFS.getStores().Avatars = UploadFS.getStore(`${store}:Avatars`);
		UploadFS.getStores().Uploads = UploadFS.getStore(`${store}:Uploads`);
		UploadFS.getStores().UserDataFiles = UploadFS.getStore(`${store}:UserDataFiles`);
	}
}, 1000);

settings.watchByRegex(/^FileUpload_/, configStore);
