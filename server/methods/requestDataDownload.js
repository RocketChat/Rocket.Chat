import fs from 'fs';
import path from 'path';

import mkdirp from 'mkdirp';
import { Meteor } from 'meteor/meteor';

import { ExportOperations, UserDataFiles } from '../../app/models';
import { settings } from '../../app/settings';

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
		const requestDay = lastOperation ? lastOperation.createdAt : new Date();
		const pendingOperationsBeforeMyRequestCount = ExportOperations.findAllPendingBeforeMyRequest(requestDay).count();

		if (lastOperation) {
			const yesterday = new Date();
			yesterday.setUTCDate(yesterday.getUTCDate() - 1);

			if (lastOperation.createdAt > yesterday) {
				if (lastOperation.status === 'completed') {
					const file = lastOperation.fileId ? UserDataFiles.findOneById(lastOperation.fileId) : UserDataFiles.findLastFileByUser(userId);
					if (file) {
						return {
							requested: false,
							exportOperation: lastOperation,
							url: file.url,
							pendingOperationsBeforeMyRequest: pendingOperationsBeforeMyRequestCount,
						};
					}
				}

				return {
					requested: false,
					exportOperation: lastOperation,
					url: null,
					pendingOperationsBeforeMyRequest: pendingOperationsBeforeMyRequestCount,
				};
			}
		}

		if (!fs.existsSync(tempFolder)) {
			mkdirp.sync(tempFolder);
		}

		const exportOperation = {
			userId: currentUserData._id,
			roomList: null,
			status: 'preparing',
			fileList: [],
			generatedFile: null,
			fullExport,
			userData: currentUserData,
		};

		const id = ExportOperations.create(exportOperation);
		exportOperation._id = id;

		const folderName = path.join(tempFolder, id);
		if (!fs.existsSync(folderName)) {
			mkdirp.sync(folderName);
		}

		const assetsFolder = path.join(folderName, 'assets');
		if (!fs.existsSync(assetsFolder)) {
			mkdirp.sync(assetsFolder);
		}

		exportOperation.exportPath = folderName;
		exportOperation.assetsPath = assetsFolder;
		exportOperation.status = 'pending';

		ExportOperations.updateOperation(exportOperation);

		return {
			requested: true,
			exportOperation,
			url: null,
			pendingOperationsBeforeMyRequest: pendingOperationsBeforeMyRequestCount,
		};
	},
});
