import path from 'path';

Meteor.methods({
	requestDataDownload() {
		const currentUserData = Meteor.user();

		const folderName = path.join('/tmp/', currentUserData._id);
		const exportOperation = {
			userId : currentUserData._id,
			roomList: null,
			status: 'pending',
			exportPath: folderName
		};

		RocketChat.models.ExportOperations.create(exportOperation);
	}
});
