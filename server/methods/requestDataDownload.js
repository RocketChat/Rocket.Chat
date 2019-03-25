import { Meteor } from 'meteor/meteor';
import { ExportOperations } from '../../app/models';
import { settings } from '../../app/settings';
import fs from 'fs';
import path from 'path';

let tempFolder = '/tmp/userData';
if (settings.get('UserData_FileSystemPath') != null) {
	if (settings.get('UserData_FileSystemPath').trim() !== '') {
		tempFolder = settings.get('UserData_FileSystemPath');
	}
}

Meteor.methods({
	requestDataDownload({ fullExport = false }) {
		const currentUserData = Meteor.user();
		const userId = currentUserData._id;

		const lastOperation = ExportOperations.findLastOperationByUser(userId, fullExport);

		if (lastOperation) {
			const yesterday = new Date();
			yesterday.setUTCDate(yesterday.getUTCDate() - 1);

			if (lastOperation.createdAt > yesterday) {
				return {
					requested: false,
					exportOperation: lastOperation,
				};
			}
		}

		if (!fs.existsSync(tempFolder)) {
			fs.mkdirSync(tempFolder);
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
			fullExport,
		};

		ExportOperations.create(exportOperation);

		return {
			requested: true,
			exportOperation,
		};
	},
});
