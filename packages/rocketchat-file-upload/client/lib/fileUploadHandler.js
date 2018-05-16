/* globals FileUploadBase, UploadFS, fileUploadHandler:true */
/* exported fileUploadHandler */

new UploadFS.Store({
	collection: RocketChat.models.Uploads.model,
	name: 'Uploads',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

new UploadFS.Store({
	collection: RocketChat.models.Avatars.model,
	name: 'Avatars',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

fileUploadHandler = (directive, meta, file) => {
	const store = UploadFS.getStore(directive);

	if (store) {
		return new FileUploadBase(store, meta, file);
	} else {
		console.error('Invalid file store', directive);
	}
};

Tracker.autorun(function() {
	if (Meteor.userId()) {
		document.cookie = `rc_uid=${ escape(Meteor.userId()) }; path=/`;
		document.cookie = `rc_token=${ escape(Accounts._storedLoginToken()) }; path=/`;
	}
});
