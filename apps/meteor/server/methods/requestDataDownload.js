import fs from 'fs';
import path from 'path';

import mkdirp from 'mkdirp';
import { Meteor } from 'meteor/meteor';

import { ExportOperations, UserDataFiles } from '../../app/models/server/raw';
import { settings } from '../../app/settings/server';
import { DataExport } from '../../app/user-data-download/server/DataExport';

let tempFolder = '/tmp/userData';
if (settings.get('UserData_FileSystemPath') != null) {
	if (settings.get('UserData_FileSystemPath').trim() !== '') {
		tempFolder = settings.get('UserData_FileSystemPath');
	}
}

Meteor.methods({
	async requestDataDownload({ fullExport = false }) {
		const currentUserData = Meteor.user();
		const userId = currentUserData._id;

		const lastOperation = await ExportOperations.findLastOperationByUser(userId, fullExport);
		const requestDay = lastOperation ? lastOperation.createdAt : new Date();
		const pendingOperationsBeforeMyRequestCount = await ExportOperations.findAllPendingBeforeMyRequest(requestDay).count();

		if (lastOperation) {
			const yesterday = new Date();
			yesterday.setUTCDate(yesterday.getUTCDate() - 1);

			if (lastOperation.createdAt > yesterday) {
				if (lastOperation.status === 'completed') {
					const file = lastOperation.fileId
						? await UserDataFiles.findOneById(lastOperation.fileId)
						: await UserDataFiles.findLastFileByUser(userId);
					if (file) {
						return {
							requested: false,
							exportOperation: lastOperation,
							url: DataExport.getPath(file._id),
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

		const id = await ExportOperations.create(exportOperation);
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

		await ExportOperations.updateOperation(exportOperation);

		return {
			requested: true,
			exportOperation,
			url: null,
			pendingOperationsBeforeMyRequest: pendingOperationsBeforeMyRequestCount,
		};
	},
});
