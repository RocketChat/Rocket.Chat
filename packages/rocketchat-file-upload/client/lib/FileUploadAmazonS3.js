/* globals FileUpload, UploadFS */

import '../../ufs/AmazonS3/client.js';

new UploadFS.store.AmazonS3({
	collection: RocketChat.models.Uploads.model,
	name: 'AmazonS3:Uploads',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

new UploadFS.store.AmazonS3({
	collection: RocketChat.models.Avatars.model,
	name: 'AmazonS3:Avatars',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});
