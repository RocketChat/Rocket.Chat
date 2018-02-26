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
		const userId = currentUserData._id;

		const lastOperation = RocketChat.models.ExportOperations.findLastOperationByUser(userId);

		if (lastOperation) {
			const yesterday = new Date();
			yesterday.setUTCDate(yesterday.getUTCDate() - 1);

			if (lastOperation.createdAt > yesterday) {
				return {
					requested: false,
					exportOperation: lastOperation
				};
			}
		}

		const folderName = path.join(tempFolder, userId);
		const assetsFolder = path.join(folderName, 'assets');

		const exportOperation = {
			userId : currentUserData._id,
			roomList: null,
			status: 'pending',
			exportPath: folderName,
			assetsPath: assetsFolder,
			fileList: [],
			generatedFile: null
		};

		RocketChat.models.ExportOperations.create(exportOperation);

		return {
			requested: true,
			exportOperation
		};
	}
});
