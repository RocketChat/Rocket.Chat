import fs from 'fs';
import path from 'path';

let tempFolder = '/tmp/userData';
if (RocketChat.settings.get('UserData_FileSystemPath') != null) {
	if (RocketChat.settings.get('UserData_FileSystemPath').trim() !== '') {
		tempFolder = RocketChat.settings.get('UserData_FileSystemPath');
	}
}

Meteor.methods({
	requestDataDownload({fullExport = false}) {
		const currentUserData = Meteor.user();
		const userId = currentUserData._id;

		const lastOperation = RocketChat.models.ExportOperations.findLastOperationByUser(userId, fullExport);

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

		const subFolderName = fullExport ? 'full' : 'partial';
		const baseFolder = path.join(tempFolder, userId);
		if (!fs.existsSync(baseFolder)) {
			fs.mkdirSync(baseFolder);
		}

		const folderName = path.join(baseFolder, subFolderName);
		if (!fs.existsSync(folderName)) {
			fs.mkdirSync(folderName);
		}
		const assetsFolder = path.join(folderName, 'assets');
		if (!fs.existsSync(assetsFolder)) {
			fs.mkdirSync(assetsFolder);
		}

		const exportOperation = {
			userId : currentUserData._id,
			roomList: null,
			status: 'pending',
			exportPath: folderName,
			assetsPath: assetsFolder,
			fileList: [],
			generatedFile: null,
			fullExport
		};

		RocketChat.models.ExportOperations.create(exportOperation);

		return {
			requested: true,
			exportOperation
		};
	}
});
