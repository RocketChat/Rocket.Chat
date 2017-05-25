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

Tracker.autorun(function() {
	document.cookie = `rc_uid=${ escape(Meteor.userId()) }; path=/`;
	document.cookie = `rc_token=${ escape(Accounts._storedLoginToken()) }; path=/`;
});
