import { SystemLogger } from '../../../../server/lib/logger/system';
import { UploadFS } from '../../../../server/ufs';
import { settings } from '../../../settings/server';
import { debounce } from '../../../utils/debounce';
import './AmazonS3';
import './FileSystem';
import './GoogleStorage';
import './GridFS';
import './Webdav';

const configStore = debounce(() => {
	const store = settings.get('FileUpload_Storage_Type');

	if (store) {
		SystemLogger.info(`Setting default file store to ${store}`);
		UploadFS.getStores().Avatars = UploadFS.getStore(`${store}:Avatars`);
		UploadFS.getStores().Uploads = UploadFS.getStore(`${store}:Uploads`);
		UploadFS.getStores().UserDataFiles = UploadFS.getStore(`${store}:UserDataFiles`);
	}
}, 1000);

settings.watchByRegex(/^FileUpload_/, configStore);
