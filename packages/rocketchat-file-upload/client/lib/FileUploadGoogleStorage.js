/* globals FileUpload, UploadFS */

import '../../ufs/GoogleStorage/client.js';

new UploadFS.store.GoogleStorage({
	collection: RocketChat.models.Uploads.model,
	name: 'GoogleCloudStorage:Uploads',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

new UploadFS.store.GoogleStorage({
	collection: RocketChat.models.Avatars.model,
	name: 'GoogleCloudStorage:Avatars',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});
