/* globals UploadFS, FileUpload:true */

new UploadFS.store.Local({
	collection: RocketChat.models.Uploads.model,
	name: 'FileSystem:Uploads',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

new UploadFS.store.Local({
	collection: RocketChat.models.Avatars.model,
	name: 'FileSystem:Avatars',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});
