import _ from 'underscore';

import { settings } from '../../../../../app/settings/server';
import { UploadFS } from '../../../../ufs';
import { SystemLogger } from '../../../logger/system';
import './AmazonS3';
import './FileSystem';
import './GoogleStorage';
import './GridFS';
import './Webdav';

const configStore = _.debounce(() => {
	const store = settings.get('FileUpload_Storage_Type');

	if (store) {
		SystemLogger.info({
			msg: 'Setting default file store',
			store,
		});
		UploadFS.getStores().Avatars = UploadFS.getStore(`${store}:Avatars`);
		UploadFS.getStores().Uploads = UploadFS.getStore(`${store}:Uploads`);
		UploadFS.getStores().UserDataFiles = UploadFS.getStore(`${store}:UserDataFiles`);
	}
}, 1000);

settings.watchByRegex(/^FileUpload_/, configStore);
