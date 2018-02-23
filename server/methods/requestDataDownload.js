import path from 'path';

let tempFolder = '~/userData';
if (RocketChat.settings.get('UserData_FileSystemPath') != null) {
	if (RocketChat.settings.get('UserData_FileSystemPath').trim() !== '') {
		tempFolder = RocketChat.settings.get('UserData_FileSystemPath');
	}
}

Meteor.methods({
	requestDataDownload() {
		const currentUserData = Meteor.user();

		const folderName = path.join(tempFolder, currentUserData._id);
		const assetsFolder = path.join(folderName, 'assets');

		const exportOperation = {
			userId : currentUserData._id,
			roomList: null,
			status: 'pending',
			exportPath: folderName,
			assetsPath: assetsFolder,
			fileList: []
		};

		RocketChat.models.ExportOperations.create(exportOperation);
	}
});
