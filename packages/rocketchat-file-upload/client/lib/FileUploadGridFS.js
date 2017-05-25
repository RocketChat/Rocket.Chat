/* globals FileUpload, UploadFS */

new UploadFS.store.GridFS({
	collection: RocketChat.models.Uploads.model,
	name: 'GridFS:Uploads',
	collectionName: 'rocketchat_uploads',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

new UploadFS.store.GridFS({
	collection: RocketChat.models.Avatars.model,
	name: 'GridFS:Avatars',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});
